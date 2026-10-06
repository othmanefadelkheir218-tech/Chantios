import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExpireTokensHandler } from '../handlers/expire-tokens.handler';

/**
 * Daily housekeeping (doc/notes/Phaces/12-client-portal.md). Same shape as the
 * other jobs, at 07:00 so the daily jobs (03:00 tokens, 04:00 media, 05:00
 * invoices, 06:00 reports) don't overlap.
 */
@Injectable()
export class ExpireTokensJob {
  constructor(
    @InjectPinoLogger(ExpireTokensJob.name)
    private readonly logger: PinoLogger,
    private readonly expire: ExpireTokensHandler,
  ) {}

  @Cron('0 7 * * *')
  async run(): Promise<{ expired: number }> {
    try {
      return await this.expire.execute();
    } catch (err: unknown) {
      this.logger.error({ err }, 'Daily portal link expiry failed');
      return { expired: 0 };
    }
  }
}
