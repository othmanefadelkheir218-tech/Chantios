import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import type { PermissionScope as Scope } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { PermissionScope } from '../auth/decorators/permission-scope.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { SetAssigneesDto } from './dto/set-assignees.dto';
import { SetTaskStatusDto } from './dto/set-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

/**
 * The Gantt rows. `scope = 'own'` (the `worker` default) can only read the
 * tasks assigned to them; every write needs scope `all`.
 */
@ApiTags('Tasks')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @TenantAuth()
  @Module('tasks')
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.create(dto, actor, scope);
  }

  /** The Gantt feed: `?project_id=&status=&from=&to=`. */
  @Get()
  @TenantAuth()
  @Module('tasks')
  findAll(
    @Query() query: FindTasksQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.findAll(query, actor, scope);
  }

  @Get(':id')
  @TenantAuth()
  @Module('tasks')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.findOne(id, actor, scope);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('tasks')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.update(id, dto, actor, scope);
  }

  /** Needs at least one assignee to leave `planned`. */
  @Patch(':id/status')
  @TenantAuth()
  @Module('tasks')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetTaskStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.setStatus(id, dto, actor, scope);
  }

  /** Replaces the whole assignee set. */
  @Put(':id/assignees')
  @TenantAuth()
  @Module('tasks')
  setAssignees(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetAssigneesDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.setAssignees(id, dto, actor, scope);
  }

  @Delete(':id')
  @TenantAuth()
  @Module('tasks')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.tasksService.remove(id, actor, scope);
  }
}
