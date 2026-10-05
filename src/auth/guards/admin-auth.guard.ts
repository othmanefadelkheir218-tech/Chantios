import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenHelper } from '../helpers/token.helper';

/**
 * Platform admin equivalent of `AuthGuard`, from the `admin_access_token`
 * cookie. Sets `req.user = { id, role, email }` — the exact shape
 * `common/decorators/actor.decorator.ts` already reads (`req.user.id`), so
 * `@Actor()` starts working the moment this guard is attached, with no
 * change needed there. NOT attached to any route yet.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenHelper) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = (req.cookies as Record<string, string> | undefined)
      ?.admin_access_token;
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const payload = this.tokens.verifyAdminAccessToken(token);
      (
        req as unknown as { user: { id: number; role: string; email: string } }
      ).user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
