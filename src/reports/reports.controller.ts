import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PermissionScope as Scope } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { PermissionScope } from '../auth/decorators/permission-scope.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateReportDto } from './dto/create-report.dto';
import { DeclareMaterialsDto } from './dto/declare-materials.dto';
import { FindReportsQueryDto } from './dto/find-reports-query.dto';
import { MaterialPrefillQueryDto } from './dto/material-prefill-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

/**
 * The daily site record. Guarded by the `reports` module key for EVERY route,
 * including the two material routes: the roles that run a site (`supervisor`,
 * `leader`) hold `reports` but only `view` / `none` on `stock`, so a `stock`
 * guard would lock them out of their own main screen. The `worker` (scope
 * `own`) is refused in the handler: it logs hours only, never a report and
 * never stock. `sales` and `accountant` have no `reports` access.
 */
@ApiTags('Reports')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** Upsert on `(project_id, report_date)`. */
  @Post()
  @TenantAuth()
  @Module('reports')
  create(
    @Body() dto: CreateReportDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.reportsService.create(dto, actor, scope);
  }

  @Get()
  @TenantAuth()
  @Module('reports')
  findAll(
    @Query() query: FindReportsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.reportsService.findAll(query, actor, scope);
  }

  /** The report with its photos. */
  @Get(':id')
  @TenantAuth()
  @Module('reports')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.reportsService.findOne(id, actor, scope);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('reports')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.reportsService.update(id, dto, actor, scope);
  }

  /** A READ: the recipe walk. Calculates, saves nothing. */
  @Get(':id/material-prefill')
  @TenantAuth()
  @Module('reports')
  materialPrefill(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: MaterialPrefillQueryDto,
    @PermissionScope() scope: Scope,
  ) {
    return this.reportsService.materialPrefill(id, query, scope);
  }

  /** The only way stock leaves: one transaction, one `consumption` row per item. */
  @Post(':id/materials')
  @TenantAuth()
  @Module('reports')
  declare(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeclareMaterialsDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.reportsService.declare(id, dto, actor, scope);
  }
}
