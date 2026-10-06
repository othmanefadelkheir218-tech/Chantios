import { Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateReportDto } from '../dto/update-report.dto';
import { assertCanPost, toReportEntity } from '../helpers/report.helper';
import { ReportRepository } from '../repositories/report.repository';

/** `PATCH /api/reports/:id` — the report itself is corrected; the old value goes to `audit_logs`. */
@Injectable()
export class UpdateReportHandler {
  constructor(
    @InjectPinoLogger(UpdateReportHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    dto: UpdateReportDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.info(`Updating report ${id}`);
    assertCanPost(scope);

    const current = await this.reports.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update report: ${id} not found`);
      throw new NotFoundException('Report not found');
    }

    const updated = await this.reports.update(id, {
      ...(dto.progress_pct !== undefined && { progressPct: dto.progress_pct }),
      ...(dto.weather !== undefined && { weather: dto.weather }),
      ...(dto.note !== undefined && { note: dto.note }),
    });
    const entity = toReportEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'report',
      entityId: id,
      oldValue: toReportEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Report updated: ${id}`);
    return entity;
  }
}
