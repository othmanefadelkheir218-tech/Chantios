import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PortalTokenRepository } from '../repositories/portal-token.repository';

/**
 * The daily cron's business logic (`jobs/expire-tokens.job.ts` calls this):
 * marks every link past its `expires_at` inactive, across all tenants. Tidy-up
 * only — the guard already refuses a link past its date on every request.
 */
@Injectable()
export class ExpireTokensHandler {
  constructor(
    @InjectPinoLogger(ExpireTokensHandler.name)
    private readonly logger: PinoLogger,
    private readonly tokens: PortalTokenRepository,
  ) {}

  async execute() {
    const expired = await this.tokens.deactivateExpired();
    this.logger.info(`Portal link expiry: ${expired} link(s) marked inactive`);
    return { expired };
  }
}
