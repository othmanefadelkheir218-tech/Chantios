import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { SessionsService } from '../../sessions/sessions.service';
import { clearAdminAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';
import { AdminLoginHandler } from './admin-login.handler';

/**
 * `POST /api/admin/auth/refresh` — same rotation as the tenant refresh, with
 * the admin cookies: the old row is revoked and a new session is issued by
 * `AdminLoginHandler.issueSession()` (one place issues admin sessions). A
 * revoked token presented again revokes every session of that admin
 * (doc/notes/auth-tokens.md § Sessions seen by the frontend).
 */
@Injectable()
export class AdminRefreshHandler {
  constructor(
    @InjectPinoLogger(AdminRefreshHandler.name)
    private readonly logger: PinoLogger,
    private readonly sessions: SessionsService,
    private readonly adminUsers: AdminUsersService,
    private readonly tokens: TokenHelper,
    private readonly adminLogin: AdminLoginHandler,
  ) {}

  async execute(req: Request, res: Response) {
    const raw = (req.cookies as Record<string, string> | undefined)
      ?.admin_refresh_token;
    if (!raw) {
      throw new UnauthorizedException('No refresh token');
    }

    let payload: ReturnType<TokenHelper['verifyAdminRefreshToken']>;
    try {
      payload = this.tokens.verifyAdminRefreshToken(raw);
    } catch {
      clearAdminAuthCookies(res);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (payload.kind !== 'admin') {
      clearAdminAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const existing = await this.sessions.findByHash(this.tokens.sha256(raw));
    if (!existing || existing.adminUserId !== payload.sub) {
      clearAdminAuthCookies(res);
      throw new UnauthorizedException('Unknown refresh token');
    }

    if (existing.revokedAt) {
      this.logger.warn(
        `Revoked admin refresh token replayed for admin ${payload.sub} — revoking every session`,
      );
      await this.sessions.revokeAllForAdmin(payload.sub);
      clearAdminAuthCookies(res);
      throw new UnauthorizedException('Session revoked');
    }

    if (existing.expiresAt < new Date()) {
      clearAdminAuthCookies(res);
      throw new UnauthorizedException('Refresh token expired');
    }

    const admin = await this.adminUsers.findByIdRaw(payload.sub);
    if (!admin || !admin.isActive) {
      clearAdminAuthCookies(res);
      throw new UnauthorizedException('Account no longer active');
    }

    await this.sessions.revoke(existing.id);
    await this.adminLogin.issueSession(admin.id, req, res);
    this.logger.info(`Refreshed admin session for admin ${admin.id}`);
    return { refreshed: true };
  }
}
