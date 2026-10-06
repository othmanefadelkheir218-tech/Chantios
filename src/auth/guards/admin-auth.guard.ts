import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { TokenHelper } from '../helpers/token.helper';

/**
 * Platform admin equivalent of `AuthGuard`, from the `admin_access_token`
 * cookie. Sets `req.user = { id, role, email }` — the exact shape
 * `common/decorators/actor.decorator.ts` already reads (`req.user.id`), so
 * `@Actor()` starts working the moment this guard is attached, with no
 * change needed there. `@AdminRoles(...)` narrows a route to some `admin_users.role` values.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenHelper,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = (req.cookies as Record<string, string> | undefined)
      ?.admin_access_token;
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    let payload: ReturnType<TokenHelper['verifyAdminAccessToken']>;
    try {
      payload = this.tokens.verifyAdminAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    (
      req as unknown as { user: { id: number; role: string; email: string } }
    ).user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    const allowed = this.reflector.getAllAndOverride<string[] | undefined>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowed?.length && !allowed.includes(payload.role)) {
      throw new ForbiddenException('Not allowed for your admin role');
    }
    return true;
  }
}
