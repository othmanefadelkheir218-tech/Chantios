import { Injectable, UnauthorizedException } from '@nestjs/common';
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
import { LoginDto } from '../dto/login.dto';

/**
 * `POST /api/auth/login` — email + password, no company field
 * (doc/notes/auth-tokens.md). Same message whatever the reason, to avoid
 * telling an attacker which part was wrong.
 */
@Injectable()
export class LoginHandler {
  constructor(
    @InjectPinoLogger(LoginHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly tenants: TenantsService,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenHelper,
  ) {}

  async execute(dto: LoginDto, req: Request, res: Response) {
    const email = dto.email.toLowerCase();
    this.logger.info(`Login attempt: ${email}`);

    const user = await this.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      this.logger.warn(`Login failed: ${email} not found or has no password`);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      this.logger.warn(`Login failed: ${email} is deactivated`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.tenants.findOne(user.tenantId);
    if (tenant.status !== 'active') {
      this.logger.warn(
        `Login failed: tenant ${user.tenantId} is ${tenant.status}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await verifyPassword(user.passwordHash, dto.password))) {
      this.logger.warn(`Login failed: wrong password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

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

    this.logger.info(`Login succeeded: user ${user.id}`);
    return toUserEntity(user);
  }
}
