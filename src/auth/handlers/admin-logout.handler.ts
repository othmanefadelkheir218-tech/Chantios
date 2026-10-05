import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SessionsService } from '../../sessions/sessions.service';
import { clearAdminAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';

/** `POST /api/admin/auth/logout` — `AdminAuthGuard`. */
@Injectable()
export class AdminLogoutHandler {
  constructor(
    @InjectPinoLogger(AdminLogoutHandler.name)
    private readonly logger: PinoLogger,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenHelper,
  ) {}

  async execute(req: Request, res: Response) {
    const raw = (req.cookies as Record<string, string> | undefined)
      ?.admin_refresh_token;
    if (raw) {
      const existing = await this.sessions.findByHash(this.tokens.sha256(raw));
      if (existing && !existing.revokedAt) {
        await this.sessions.revoke(existing.id);
        this.logger.info(`Admin logged out: session ${existing.id} revoked`);
      }
    }
    clearAdminAuthCookies(res);
    return { loggedOut: true };
  }
}
