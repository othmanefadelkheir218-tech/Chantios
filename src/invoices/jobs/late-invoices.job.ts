import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { LateInvoicesHandler } from '../handlers/late-invoices.handler';

/**
 * Daily housekeeping (doc/notes/Phaces/06-quotes-invoices.md): finds every
 * late invoice system-wide and fires an alert. Same shape as
 * `src/media/jobs/purge-expired-media.job.ts` / `src/auth/jobs/cleanup-expired-tokens.job.ts`,
 * offset so the three don't run at the same time.
 */
@Injectable()
export class LateInvoicesJob {
  constructor(
    @InjectPinoLogger(LateInvoicesJob.name)
    private readonly logger: PinoLogger,
    private readonly lateInvoices: LateInvoicesHandler,
  ) {}

  @Cron('0 5 * * *')
  async run(): Promise<{ lateCount: number }> {
    try {
      return await this.lateInvoices.execute();
    } catch (err: unknown) {
      this.logger.error({ err }, 'Daily late-invoice check failed');
      return { lateCount: 0 };
    }
  }
}
