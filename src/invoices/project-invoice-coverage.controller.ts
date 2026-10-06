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
import { ProjectsService } from '../projects/projects.service';
import { InvoicesService } from './invoices.service';

/**
 * `GET /api/projects/:id/invoice-coverage` — lives in the `invoices`
 * module, not `projects`, to avoid a circular module dependency: `invoices`
 * already imports `quotes` + `projects` for its own validations, so
 * `projects` must not import `invoices` back. Same one-directional pattern
 * as `ClientProjectsController` (doc/notes/Phaces/04-clients-projects.md).
 * Guarded by `invoices:view`, same as every other route under `/invoices`.
 */
@ApiTags('Invoices')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('projects')
export class ProjectInvoiceCoverageController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Get(':id/invoice-coverage')
  @TenantAuth()
  @Module('invoices')
  async coverage(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.findOne(id); // 404s if the project doesn't exist
    return this.invoicesService.coverageForProject(id);
  }
}
