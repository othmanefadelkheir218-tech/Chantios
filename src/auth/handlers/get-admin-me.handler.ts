import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toAdminUserEntity } from '../../admin-users/helpers/admin-user.helper';
import { AdminUsersService } from '../../admin-users/admin-users.service';

/**
 * `GET /api/admin/auth/me` — `AdminAuthGuard`. The logged-in platform admin,
 * without `password_hash` / `totp_secret`. The admin frontend uses it as its
 * session check and to build its menu (doc/notes/auth-tokens.md).
 */
@Injectable()
export class GetAdminMeHandler {
  constructor(
    @InjectPinoLogger(GetAdminMeHandler.name)
    private readonly logger: PinoLogger,
    private readonly adminUsers: AdminUsersService,
  ) {}

  async execute(adminUserId: number) {
    const admin = await this.adminUsers.findByIdRaw(adminUserId);
    if (!admin || !admin.isActive) {
      this.logger.warn(
        `Admin me refused: admin ${adminUserId} missing or inactive`,
      );
      throw new UnauthorizedException('Account no longer active');
    }
    return toAdminUserEntity(admin);
  }
}
