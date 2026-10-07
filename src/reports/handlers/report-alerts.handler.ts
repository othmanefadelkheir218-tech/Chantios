import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  MISSING_REPORT_DAYS,
  STALLED_PROGRESS_DAYS,
} from '../helpers/report.helper';
import { ReportRepository } from '../repositories/report.repository';

/**
 * The daily cron's business logic (`jobs/report-alerts.job.ts` calls this),
 * system-wide:
 *  - **missing report** — a project `in_progress` with no report for 3 days;
 *  - **progress stalled** — a project `in_progress` whose `progress_pct` has
 *    not moved for 7 days.
 * It raises an alert through `NotificationsService.dispatch` and writes
 * nothing else. The alert repeats at most once per window (`dedupeDays`), so a
 * project that stays stalled is not mailed every morning.
 */
@Injectable()
export class ReportAlertsHandler {
  constructor(
    @InjectPinoLogger(ReportAlertsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async checkMissingReports() {
    const rows =
      await this.reports.findProjectsWithNoReportSince(MISSING_REPORT_DAYS);
    for (const row of rows) {
      this.logger.warn(
        `Project ${row.projectId} (tenant ${row.tenantId}) has had no site report for ${MISSING_REPORT_DAYS} days`,
      );
      await this.notifications.dispatch('missing_report', {
        tenantId: row.tenantId,
        dedupeDays: MISSING_REPORT_DAYS,
        payload: {
          entity_id: row.projectId,
          project_id: row.projectId,
          project_name: row.projectName,
          days: MISSING_REPORT_DAYS,
        },
      });
    }
    this.logger.info(`Missing-report check: ${rows.length} project(s)`);
    return { count: rows.length };
  }

  async checkStalledProgress() {
    const rows = await this.reports.findProgressUnchangedSince(
      STALLED_PROGRESS_DAYS,
    );
    for (const row of rows) {
      this.logger.warn(
        `Project ${row.projectId} (tenant ${row.tenantId}) has not moved its progress for ${STALLED_PROGRESS_DAYS} days`,
      );
      await this.notifications.dispatch('progress_stalled', {
        tenantId: row.tenantId,
        dedupeDays: STALLED_PROGRESS_DAYS,
        payload: {
          entity_id: row.projectId,
          project_id: row.projectId,
          project_name: row.projectName,
          days: STALLED_PROGRESS_DAYS,
        },
      });
    }
    this.logger.info(`Stalled-progress check: ${rows.length} project(s)`);
    return { count: rows.length };
  }
}
