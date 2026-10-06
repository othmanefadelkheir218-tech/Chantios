import { Injectable } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../../projects/projects.service';
import { CreateReportDto } from '../dto/create-report.dto';
import {
  assertCanPost,
  assertProjectInProgress,
  toReportEntity,
  todayUtc,
} from '../helpers/report.helper';
import { ReportRepository } from '../repositories/report.repository';

/**
 * `POST /api/reports` — upsert on `(tenant_id, project_id, report_date)`:
 * a second post for the same project and day EDITS that report, never a
 * second row. `progress_pct` 0–100 (DTO + the DB check). The project must be
 * `in_progress`. A `worker` (scope `own`) can never post.
 */
@Injectable()
export class CreateReportHandler {
  constructor(
    @InjectPinoLogger(CreateReportHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly projects: ProjectsService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    dto: CreateReportDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    assertCanPost(scope);
    const reportDay = dto.report_date ?? todayUtc();
    this.logger.info(
      `Posting report for project ${dto.project_id}, ${reportDay}: ${dto.progress_pct}%`,
    );

    // Throws NotFoundException if the project does not belong to this tenant.
    const project = await this.projects.findOne(dto.project_id);
    assertProjectInProgress(project.status);

    const reportDate = new Date(reportDay);
    const existing = await this.reports.findByProjectAndDate(
      dto.project_id,
      reportDate,
    );

    if (existing) {
      this.logger.info(
        `A report already exists for that day (${existing.id}) — updating it`,
      );
      const updated = await this.reports.update(existing.id, {
        progressPct: dto.progress_pct,
        ...(dto.weather !== undefined && { weather: dto.weather }),
        ...(dto.note !== undefined && { note: dto.note }),
      });
      const entity = toReportEntity(updated);
      await this.audit.write({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'update',
        entityType: 'report',
        entityId: existing.id,
        oldValue: toReportEntity(existing),
        newValue: entity,
        ipAddress: null,
      });
      return entity;
    }

    const created = await this.reports.create({
      tenantId: actor.tenantId,
      projectId: dto.project_id,
      reportDate,
      progressPct: dto.progress_pct,
      weather: dto.weather ?? null,
      note: dto.note ?? null,
      createdBy: actor.userId,
    });
    const entity = toReportEntity(created);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'report',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Report created: ${created.id}`);
    return entity;
  }
}
