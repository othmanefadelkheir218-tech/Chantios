import { Injectable } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { DeclareMaterialsDto } from './dto/declare-materials.dto';
import { FindReportsQueryDto } from './dto/find-reports-query.dto';
import { MaterialPrefillQueryDto } from './dto/material-prefill-query.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { CreateReportHandler } from './handlers/create-report.handler';
import { DeclareMaterialsHandler } from './handlers/declare-materials.handler';
import { FindReportsHandler } from './handlers/find-reports.handler';
import { LatestProgressHandler } from './handlers/latest-progress.handler';
import { PrefillMaterialsHandler } from './handlers/prefill-materials.handler';
import { UpdateReportHandler } from './handlers/update-report.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ReportsService {
  constructor(
    private readonly createReport: CreateReportHandler,
    private readonly findReports: FindReportsHandler,
    private readonly updateReport: UpdateReportHandler,
    private readonly declareMaterials: DeclareMaterialsHandler,
    private readonly prefillMaterials: PrefillMaterialsHandler,
    private readonly latestProgress: LatestProgressHandler,
  ) {}

  create(
    dto: CreateReportDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.createReport.execute(dto, actor, scope);
  }

  findAll(
    query: FindReportsQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.findReports.execute(query, actor, scope);
  }

  findOne(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    return this.findReports.findOne(id, actor, scope);
  }

  update(
    id: number,
    dto: UpdateReportDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.updateReport.execute(id, dto, actor, scope);
  }

  materialPrefill(
    id: number,
    query: MaterialPrefillQueryDto,
    scope: PermissionScope,
  ) {
    return this.prefillMaterials.execute(id, query, scope);
  }

  declare(
    id: number,
    dto: DeclareMaterialsDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.declareMaterials.execute(id, dto, actor, scope);
  }

  // ---- Internal API for step 12 (client portal) and step 10 (margin) ----

  /** The newest report's `progress_pct` of a project (0 if no report yet). */
  progress(projectId: number) {
    return this.latestProgress.execute(projectId);
  }
}
