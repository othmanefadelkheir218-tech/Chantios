import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PurgeExpiredMediaHandler } from '../handlers/purge-expired-media.handler';

/**
 * Daily housekeeping (doc/notes/Phaces/03-media.md): hard-delete trashed
 * `media` rows older than 30 days. Same shape as
 * `src/auth/jobs/cleanup-expired-tokens.job.ts`, offset by an hour so the
 * two don't run at the same time.
 */
@Injectable()
export class PurgeExpiredMediaJob {
  constructor(
    @InjectPinoLogger(PurgeExpiredMediaJob.name)
    private readonly logger: PinoLogger,
    private readonly purge: PurgeExpiredMediaHandler,
  ) {}

  @Cron('0 4 * * *')
  async run(): Promise<{ purged: number; skipped: number }> {
    try {
      return await this.purge.execute();
    } catch (err: unknown) {
      this.logger.error({ err }, 'Daily media trash purge failed');
      return { purged: 0, skipped: 0 };
    }
  }
}
