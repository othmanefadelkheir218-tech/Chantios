import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ReportAlertsHandler } from '../handlers/report-alerts.handler';

/**
 * Daily housekeeping (doc/notes/Phaces/09-site-reports.md): the missing-report
 * and progress-stalled checks. Same shape as `late-invoices.job.ts`, at 06:00
 * so the daily jobs (03:00 tokens, 04:00 media, 05:00 invoices) don't overlap.
 */
@Injectable()
export class ReportAlertsJob {
  constructor(
    @InjectPinoLogger(ReportAlertsJob.name)
    private readonly logger: PinoLogger,
    private readonly alerts: ReportAlertsHandler,
  ) {}

  @Cron('0 6 * * *')
  async run(): Promise<{ missing: number; stalled: number }> {
    try {
      const missing = await this.alerts.checkMissingReports();
      const stalled = await this.alerts.checkStalledProgress();
      return { missing: missing.count, stalled: stalled.count };
    } catch (err: unknown) {
      this.logger.error({ err }, 'Daily site-report alert check failed');
      return { missing: 0, stalled: 0 };
    }
  }
}
