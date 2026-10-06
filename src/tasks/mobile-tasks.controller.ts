import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { TasksService } from './tasks.service';

/**
 * The `worker` screen. A convenience wrapper over the same handlers, behind
 * the same guards as the desktop routes (the module key `tasks`), so a role
 * with no access to tasks gets `403` here too.
 */
@ApiTags('Tasks')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('mobile')
export class MobileTasksController {
  constructor(private readonly tasksService: TasksService) {}

  /** Own tasks only — whatever the caller's role. */
  @Get('my-tasks')
  @TenantAuth()
  @Module('tasks')
  myTasks(
    @Query() query: FindTasksQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.tasksService.findMine(query, actor);
  }
}
