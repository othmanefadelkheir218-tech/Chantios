import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import ms from 'ms';
import type { StringValue } from 'ms';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { env } from '../../config/env.config';
import { verifyPassword } from '../../common/helpers/password.helper';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { SessionsService } from '../../sessions/sessions.service';
import { setAdminAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';
import { AdminLoginDto } from '../dto/admin-login.dto';

/**
 * `POST /api/admin/auth/login` — password, then a 2FA challenge
 * (`verify-2fa.handler.ts`). No enrollment route exists yet in this step, so
 * an admin with no `totp_secret` set logs in directly — 2FA cannot be
 * required before there is a way to set it up.
 */
@Injectable()
export class AdminLoginHandler {
  constructor(
    @InjectPinoLogger(AdminLoginHandler.name)
    private readonly logger: PinoLogger,
    private readonly adminUsers: AdminUsersService,
    private readonly sessions: SessionsService,
    private readonly codes: OneTimeCodesService,
    private readonly tokens: TokenHelper,
  ) {}

  async execute(dto: AdminLoginDto, req: Request, res: Response) {
    const email = dto.email.toLowerCase();
    const admin = await this.adminUsers.findByEmail(email);
    if (!admin || !admin.isActive) {
      this.logger.warn(`Admin login failed: ${email} not found or inactive`);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!(await verifyPassword(admin.passwordHash, dto.password))) {
      this.logger.warn(`Admin login failed: wrong password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.totpSecret) {
      // A new login replaces any older challenge, so only the newest token works.
      const challengeId = await this.codes.openChallenge('admin_2fa', {
        adminUserId: admin.id,
      });
      const challengeToken = this.tokens.signAdmin2faChallenge(
        admin.id,
        challengeId,
      );
      this.logger.info(`Admin ${admin.id} password OK — 2FA challenge issued`);
      return { challenge_token: challengeToken };
    }

    return this.issueSession(admin.id, req, res);
  }

  async issueSession(adminId: number, req: Request, res: Response) {
    const admin = await this.adminUsers.findByIdRaw(adminId);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.tokens.signAdminAccessToken({
      sub: admin.id,
      role: admin.role,
      email: admin.email,
    });
    const { token: refreshToken } = this.tokens.signAdminRefreshToken(admin.id);
    await this.sessions.issue({
      adminUserId: admin.id,
      tokenHash: this.tokens.sha256(refreshToken),
      expiresAt: new Date(
        Date.now() + ms(env.JWT_REFRESH_EXPIRES_IN as StringValue),
      ),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    setAdminAuthCookies(res, accessToken, refreshToken);
    this.logger.info(`Admin login succeeded: ${admin.id}`);
    return { logged_in: true };
  }
}
