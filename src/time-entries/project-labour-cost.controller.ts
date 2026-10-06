import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { TimeEntriesService } from './time-entries.service';

/**
 * `GET /api/projects/:id/labour-cost` lives here, not in `ProjectsModule`:
 * `time-entries` imports `projects` (to validate the project), so `projects`
 * cannot import this module back. Same one-directional rule as
 * `client-projects.controller.ts`.
 */
@ApiTags('Time entries')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('projects')
export class ProjectLabourCostController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get(':id/labour-cost')
  @TenantAuth()
  @Module('margins')
  labourCost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.timeEntriesService.projectLabourCost(id, actor);
  }
}
