import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { ChangeStatusDto } from './dto/change-status.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @TenantAuth()
  @Module('projects')
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.projectsService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('projects')
  findAll(@Query() query: FindProjectsQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('projects')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/history')
  @TenantAuth()
  @Module('projects')
  history(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.history(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('projects')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, dto, actor);
  }

  /**
   * Status changes get their own route on purpose — a generic `PATCH` that
   * accepted `status` would bypass the transition matrix (that was one of
   * the bugs found in testing, doc/notes/Phaces/04-clients-projects.md).
   */
  @Patch(':id/status')
  @TenantAuth()
  @Module('projects')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.projectsService.changeProjectStatus(id, dto, actor);
  }

  /** Hard delete, `prospect`-status only. Cascades to this project's `media`. */
  @Delete(':id')
  @TenantAuth()
  @Module('projects')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.projectsService.remove(id, actor);
  }
}
