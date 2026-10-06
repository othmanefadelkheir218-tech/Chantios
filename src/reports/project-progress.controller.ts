import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ReportsService } from './reports.service';

/**
 * `GET /api/projects/:id/progress` lives here, not in `ProjectsModule`:
 * `reports` imports `projects` (to validate the project), so `projects`
 * cannot import this module back. Same one-directional rule as
 * `client-projects.controller.ts`.
 */
@ApiTags('Reports')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('projects')
export class ProjectProgressController {
  constructor(private readonly reportsService: ReportsService) {}

  /** The newest report's `progress_pct` — read, never stored on the project. */
  @Get(':id/progress')
  @TenantAuth()
  @Module('projects')
  progress(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.progress(id);
  }
}
