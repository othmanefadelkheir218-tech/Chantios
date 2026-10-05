import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SessionsService } from '../../sessions/sessions.service';
import { clearAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';

/** `POST /api/auth/logout` — clears both cookies, revokes that one row. */
@Injectable()
export class LogoutHandler {
  constructor(
    @InjectPinoLogger(LogoutHandler.name)
    private readonly logger: PinoLogger,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenHelper,
  ) {}

  async execute(req: Request, res: Response) {
    const raw = (req.cookies as Record<string, string> | undefined)
      ?.refresh_token;
    if (raw) {
      const existing = await this.sessions.findByHash(this.tokens.sha256(raw));
      if (existing && !existing.revokedAt) {
        await this.sessions.revoke(existing.id);
        this.logger.info(`Logged out: session ${existing.id} revoked`);
      }
    }
    clearAuthCookies(res);
    return { loggedOut: true };
  }
}
