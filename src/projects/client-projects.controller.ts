import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { ProjectsService } from './projects.service';

/**
 * `GET /api/clients/:id/projects` — lives in the `projects` module, not
 * `clients`, to avoid a circular module dependency: `projects` already
 * imports `clients` (to validate `client_id` on create), so `clients` must
 * not import `projects` back. Same one-directional pattern as
 * `MediaController.replaceTenantLogo` (doc/notes/media-files.md). Guarded
 * by `clients:view`, same as every other route under `/clients`.
 */
@ApiTags('Clients')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('clients')
export class ClientProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(':clientId/projects')
  @TenantAuth()
  @Module('clients')
  findForClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query() query: FindProjectsQueryDto,
  ) {
    return this.projectsService.findAll({ ...query, client_id: clientId });
  }
}
