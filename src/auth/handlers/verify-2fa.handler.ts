import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { verify as verifyTotp } from 'otplib';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { Verify2faDto } from '../dto/verify-2fa.dto';
import { TokenHelper } from '../helpers/token.helper';
import { AdminLoginHandler } from './admin-login.handler';

/**
 * `POST /api/admin/auth/verify-2fa` — TOTP, 5 min, 3 tries. The code comes
 * from the admin's authenticator app (otplib), never emailed — the secret
 * lives on `admin_users.totp_secret` (doc/notes/auth-tokens.md).
 */
@Injectable()
export class Verify2faHandler {
  constructor(
    @InjectPinoLogger(Verify2faHandler.name)
    private readonly logger: PinoLogger,
    private readonly adminUsers: AdminUsersService,
    private readonly tokens: TokenHelper,
    private readonly adminLogin: AdminLoginHandler,
  ) {}

  async execute(dto: Verify2faDto, req: Request, res: Response) {
    let adminId: number;
    try {
      adminId = this.tokens.verifyAdmin2faChallenge(dto.challenge_token).sub;
    } catch {
      throw new UnauthorizedException('2FA challenge expired — log in again');
    }

    const admin = await this.adminUsers.findByIdRaw(adminId);
    if (!admin || !admin.totpSecret) {
      throw new UnauthorizedException('2FA is not set up for this account');
    }

    const result = await verifyTotp({
      secret: admin.totpSecret,
      token: dto.code,
      strategy: 'totp',
    });
    if (!result.valid) {
      this.logger.warn(`2FA failed for admin ${admin.id}`);
      throw new UnauthorizedException('Invalid code');
    }

    this.logger.info(`2FA verified for admin ${admin.id}`);
    return this.adminLogin.issueSession(admin.id, req, res);
  }
}
