import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, PermissionScope, TaskStatus } from '@prisma/client';

export type TaskWithAssignees = Prisma.TaskGetPayload<{
  include: { assignees: true };
}>;

/** What may leave the module: the task with the ids of the people on it. */
export function toTaskEntity(task: TaskWithAssignees) {
  return {
    id: task.id,
    tenantId: task.tenantId,
    projectId: task.projectId,
    title: task.title,
    type: task.type,
    startDate: task.startDate,
    endDate: task.endDate,
    status: task.status,
    assigneeIds: task.assignees.map((a) => a.userId),
    createdBy: task.createdBy,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * Builds the Prisma filter for the task list (the Gantt feed). `from`/`to`
 * keep every task whose date range overlaps the window. `assigneeId` limits
 * the list to one person's tasks (`scope = 'own'`, and `/mobile/my-tasks`).
 */
export function buildTaskFilter(filters: {
  projectId?: number;
  status?: TaskStatus;
  from?: string;
  to?: string;
  assigneeId?: number;
}): Prisma.TaskWhereInput {
  return {
    ...(filters.projectId !== undefined && { projectId: filters.projectId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.from && { endDate: { gte: new Date(filters.from) } }),
    ...(filters.to && { startDate: { lte: new Date(filters.to) } }),
    ...(filters.assigneeId !== undefined && {
      assignees: { some: { userId: filters.assigneeId } },
    }),
  };
}

/** The same user twice in one set is refused with a clear message (the DB unique backs it up). */
export function assertNoDuplicateUsers(userIds: number[]): void {
  if (new Set(userIds).size !== userIds.length) {
    throw new BadRequestException('A user can only be assigned once per task');
  }
}

/** A task with no assignee can never leave `planned`. */
export function assertCanLeavePlanned(
  target: TaskStatus,
  assigneeCount: number,
): void {
  if (target !== 'planned' && assigneeCount < 1) {
    throw new BadRequestException(
      'A task needs at least one assignee before it can leave planned',
    );
  }
}

/**
 * Scope `own` (the `worker` default) is a read scope for tasks: a worker
 * sees their own tasks, never plans or changes the schedule.
 */
export function assertFullScope(scope: PermissionScope): void {
  if (scope === 'own') {
    throw new ForbiddenException(
      'Your role can only view the tasks assigned to you',
    );
  }
}
