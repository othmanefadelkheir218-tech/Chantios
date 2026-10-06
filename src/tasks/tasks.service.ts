import { Injectable } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { SetAssigneesDto } from './dto/set-assignees.dto';
import { SetTaskStatusDto } from './dto/set-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskHandler } from './handlers/create-task.handler';
import { DeleteTaskHandler } from './handlers/delete-task.handler';
import { FindTasksHandler } from './handlers/find-tasks.handler';
import { MyTasksHandler } from './handlers/my-tasks.handler';
import { SetAssigneesHandler } from './handlers/set-assignees.handler';
import { SetTaskStatusHandler } from './handlers/set-task-status.handler';
import { UpdateTaskHandler } from './handlers/update-task.handler';
import { TaskRepository } from './repositories/task.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class TasksService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly createTask: CreateTaskHandler,
    private readonly findTasks: FindTasksHandler,
    private readonly myTasks: MyTasksHandler,
    private readonly updateTask: UpdateTaskHandler,
    private readonly setTaskStatus: SetTaskStatusHandler,
    private readonly setTaskAssignees: SetAssigneesHandler,
    private readonly deleteTask: DeleteTaskHandler,
  ) {}

  create(dto: CreateTaskDto, actor: AuthenticatedUser, scope: PermissionScope) {
    return this.createTask.execute(dto, actor, scope);
  }

  findAll(
    query: FindTasksQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.findTasks.execute(query, actor, scope);
  }

  findOne(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    return this.findTasks.findOne(id, actor, scope);
  }

  findMine(query: FindTasksQueryDto, actor: AuthenticatedUser) {
    return this.myTasks.execute(query, actor);
  }

  update(
    id: number,
    dto: UpdateTaskDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.updateTask.execute(id, dto, actor, scope);
  }

  setStatus(
    id: number,
    dto: SetTaskStatusDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.setTaskStatus.execute(id, dto, actor, scope);
  }

  setAssignees(
    id: number,
    dto: SetAssigneesDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.setTaskAssignees.execute(id, dto, actor, scope);
  }

  remove(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    return this.deleteTask.execute(id, actor, scope);
  }

  // ---- Internal API for `time-entries` ----

  /** The worker hour-scope rule: assignee on at least one task of the project. */
  isAssignedToProject(userId: number, projectId: number): Promise<boolean> {
    return this.tasks.isAssignedToProject(userId, projectId);
  }

  /** The raw task row (with assignees), scoped to the current tenant, or `null`. */
  findByIdRaw(id: number) {
    return this.tasks.findById(id);
  }
}
