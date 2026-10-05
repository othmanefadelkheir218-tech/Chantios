import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import ms from 'ms';
import type { StringValue } from 'ms';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { env } from '../../config/env.config';
import { SessionsService } from '../../sessions/sessions.service';
import { toUserEntity } from '../../users/helpers/user.helper';
import { UsersService } from '../../users/users.service';
import { clearAuthCookies, setAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';

/**
 * `POST /api/auth/refresh` — rotation: a new row is issued and the old one
 * revoked. If an already-revoked token is presented again, every session for
 * that user is revoked — it means the token was stolen (doc/notes/auth-tokens.md).
 */
@Injectable()
export class RefreshHandler {
  constructor(
    @InjectPinoLogger(RefreshHandler.name)
    private readonly logger: PinoLogger,
    private readonly sessions: SessionsService,
    private readonly users: UsersService,
    private readonly tokens: TokenHelper,
  ) {}

  async execute(req: Request, res: Response) {
    const raw = (req.cookies as Record<string, string> | undefined)
      ?.refresh_token;
    if (!raw) {
      throw new UnauthorizedException('No refresh token');
    }

    let payload: ReturnType<TokenHelper['verifyRefreshToken']>;
    try {
      payload = this.tokens.verifyRefreshToken(raw);
    } catch {
      clearAuthCookies(res);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const hash = this.tokens.sha256(raw);
    const existing = await this.sessions.findByHash(hash);
    if (!existing) {
      clearAuthCookies(res);
      throw new UnauthorizedException('Unknown refresh token');
    }

    if (existing.revokedAt) {
      this.logger.warn(
        `Revoked refresh token replayed for user ${payload.sub} — revoking every session`,
      );
      await this.sessions.revokeAllForUser(payload.sub);
      clearAuthCookies(res);
      throw new UnauthorizedException('Session revoked');
    }

    if (existing.expiresAt < new Date()) {
      clearAuthCookies(res);
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.users.findByIdRaw(payload.sub);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      throw new UnauthorizedException('Account no longer active');
    }

    await this.sessions.revoke(existing.id);
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      email: user.email,
    });
    const { token: newRefreshToken } = this.tokens.signRefreshToken(
      user.tenantId,
      user.id,
    );
    await this.sessions.issue({
      userId: user.id,
      tokenHash: this.tokens.sha256(newRefreshToken),
      expiresAt: new Date(
        Date.now() + ms(env.JWT_REFRESH_EXPIRES_IN as StringValue),
      ),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    setAuthCookies(res, accessToken, newRefreshToken);

    this.logger.info(`Refreshed session for user ${user.id}`);
    return toUserEntity(user);
  }
}
