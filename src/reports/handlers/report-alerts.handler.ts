import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
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
 * It fires an alert only and writes nothing. Real alert delivery is step 13's
 * job; a warning log is the placeholder, same as `late-invoices.handler.ts`.
 */
@Injectable()
export class ReportAlertsHandler {
  constructor(
    @InjectPinoLogger(ReportAlertsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
  ) {}

  async checkMissingReports() {
    const rows =
      await this.reports.findProjectsWithNoReportSince(MISSING_REPORT_DAYS);
    for (const row of rows) {
      this.logger.warn(
        `Project ${row.projectId} (tenant ${row.tenantId}) has had no site report for ${MISSING_REPORT_DAYS} days`,
      );
      // TODO: step 13 — fire the "missing report" alert to the project manager here
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
      // TODO: step 13 — fire the "progress stalled" alert to the project manager here
    }
    this.logger.info(`Stalled-progress check: ${rows.length} project(s)`);
    return { count: rows.length };
  }
}
