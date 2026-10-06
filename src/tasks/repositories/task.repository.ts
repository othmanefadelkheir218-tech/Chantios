import { Injectable } from '@nestjs/common';
import { Prisma, Task, TaskStatus } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { TaskWithAssignees } from '../helpers/task.helper';

/** The only place where the tasks module talks to the database (`tasks` + `task_assignees`). */
@Injectable()
export class TaskRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** One task + its assignee rows, in the caller's transaction (`tx` required). */
  async create(
    data: Prisma.TaskUncheckedCreateInput,
    assigneeIds: number[],
    tx: TenantTransactionClient,
  ): Promise<TaskWithAssignees> {
    const task = await tx.task.create({ data });
    if (assigneeIds.length > 0) {
      await tx.taskAssignee.createMany({
        data: assigneeIds.map((userId) => ({
          tenantId: task.tenantId,
          taskId: task.id,
          userId,
        })),
      });
    }
    return tx.task.findFirstOrThrow({
      where: { id: task.id },
      include: { assignees: true },
    });
  }

  findById(id: number): Promise<TaskWithAssignees | null> {
    return this.tenantPrisma.db.task.findFirst({
      where: { id },
      include: { assignees: true },
    });
  }

  async findMany(
    where: Prisma.TaskWhereInput,
    skip: number,
    take: number,
  ): Promise<[TaskWithAssignees[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.task.findMany({
        where,
        include: { assignees: true },
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.task.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.TaskUpdateInput): Promise<Task> {
    return this.tenantPrisma.db.task.update({ where: { id }, data });
  }

  setStatus(id: number, status: TaskStatus): Promise<Task> {
    return this.tenantPrisma.db.task.update({
      where: { id },
      data: { status },
    });
  }

  /** Hard delete — the assignee rows cascade, time entries keep their row (`task_id` -> NULL). */
  delete(id: number): Promise<Task> {
    return this.tenantPrisma.db.task.delete({ where: { id } });
  }

  countAssignees(taskId: number): Promise<number> {
    return this.tenantPrisma.db.taskAssignee.count({ where: { taskId } });
  }

  /** Replaces the whole assignee set (`tx` required — delete + insert is one step). */
  async replaceAssignees(
    taskId: number,
    tenantId: number,
    userIds: number[],
    tx: TenantTransactionClient,
  ): Promise<void> {
    await tx.taskAssignee.deleteMany({ where: { taskId } });
    await tx.taskAssignee.createMany({
      data: userIds.map((userId) => ({ tenantId, taskId, userId })),
    });
  }

  /** Is this user an assignee on at least one task of the project? (the worker hour-scope rule) */
  async isAssignedToProject(
    userId: number,
    projectId: number,
  ): Promise<boolean> {
    const row = await this.tenantPrisma.db.taskAssignee.findFirst({
      where: { userId, task: { projectId } },
      select: { id: true },
    });
    return row !== null;
  }
}
