import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';
import { TokenHelper } from '../helpers/token.helper';

/**
 * Pipeline step 1 (doc/notes/Phaces/02-auth-users.md): valid JWT from the
 * `access_token` httpOnly cookie? Fills `req.user` for `@CurrentUser()` and
 * for `TenantGuard` right after it. NOT attached to any route yet — see
 * doc/notes/WhereIStop/state.md.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenHelper) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = (req.cookies as Record<string, string> | undefined)
      ?.access_token;
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const payload = this.tokens.verifyAccessToken(token);
      const user: AuthenticatedUser = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        roleId: payload.roleId,
        email: payload.email,
      };
      (req as unknown as { user: AuthenticatedUser }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}
