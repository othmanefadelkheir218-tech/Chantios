import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { SessionsService } from '../../sessions/sessions.service';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Daily housekeeping (doc/notes/Phaces/02-auth-users.md): delete refresh
 * tokens and one-time codes that expired more than 30 days ago.
 */
@Injectable()
export class CleanupExpiredTokensJob {
  constructor(
    @InjectPinoLogger(CleanupExpiredTokensJob.name)
    private readonly logger: PinoLogger,
    private readonly sessions: SessionsService,
    private readonly codes: OneTimeCodesService,
  ) {}

  @Cron('0 3 * * *')
  async run(): Promise<{ refreshTokens: number; codes: number }> {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    try {
      const refreshTokens = await this.sessions.deleteExpiredOlderThan(cutoff);
      const codes = await this.codes.deleteExpiredOlderThan(cutoff);
      this.logger.info(
        `Cleanup: deleted ${refreshTokens} refresh token(s), ${codes} code(s) expired before ${cutoff.toISOString()}`,
      );
      return { refreshTokens, codes };
    } catch (err: unknown) {
      this.logger.error({ err }, 'Cleanup of expired tokens failed');
      return { refreshTokens: 0, codes: 0 };
    }
  }
}
