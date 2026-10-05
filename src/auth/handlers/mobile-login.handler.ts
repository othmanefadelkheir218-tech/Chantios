import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import ms from 'ms';
import type { StringValue } from 'ms';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { env } from '../../config/env.config';
import { verifyPassword } from '../../common/helpers/password.helper';
import { SessionsService } from '../../sessions/sessions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { toUserEntity } from '../../users/helpers/user.helper';
import { UsersService } from '../../users/users.service';
import { setAuthCookies } from '../helpers/cookie.helper';
import { TokenHelper } from '../helpers/token.helper';
import { MobileLoginDto } from '../dto/mobile-login.dto';

const WORKER_ROLE_ID = 5;
const MAX_FAILED_PIN = 5;

/** `POST /api/mobile/login` — email + PIN, `worker` role only. Locks after 5 wrong tries. */
@Injectable()
export class MobileLoginHandler {
  constructor(
    @InjectPinoLogger(MobileLoginHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly tenants: TenantsService,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenHelper,
  ) {}

  async execute(dto: MobileLoginDto, req: Request, res: Response) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || !user.mobilePinHash || user.roleId !== WORKER_ROLE_ID) {
      this.logger.warn(
        `Mobile login failed: ${email} not found or not a worker`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.failedPinCount >= MAX_FAILED_PIN) {
      this.logger.warn(`Mobile login blocked: user ${user.id} is locked`);
      throw new ForbiddenException(
        'Locked after too many wrong PINs — contact your admin',
      );
    }

    const tenant = await this.tenants.findOne(user.tenantId);
    if (tenant.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await verifyPassword(user.mobilePinHash, dto.pin))) {
      const count = await this.users.bumpFailedPin(user.id);
      this.logger.warn(
        `Mobile login failed: wrong PIN for user ${user.id} (${count}/${MAX_FAILED_PIN})`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.users.resetFailedPin(user.id);

    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
      email: user.email,
    });
    const { token: refreshToken } = this.tokens.signRefreshToken(
      user.tenantId,
      user.id,
    );
    await this.sessions.issue({
      userId: user.id,
      tokenHash: this.tokens.sha256(refreshToken),
      expiresAt: new Date(
        Date.now() + ms(env.JWT_REFRESH_EXPIRES_IN as StringValue),
      ),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    setAuthCookies(res, accessToken, refreshToken);

    this.logger.info(`Mobile login succeeded: user ${user.id}`);
    return toUserEntity(user);
  }
}
