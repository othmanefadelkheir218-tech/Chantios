import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Who `AuthGuard` resolved the request's JWT to — the tenant-side actor. */
export interface AuthenticatedUser {
  userId: number;
  tenantId: number;
  roleId: number;
  email: string;
}

/**
 * Reads the current tenant-side user. Filled by `AuthGuard` into `req.user`
 * (not attached to any route yet — see doc/notes/WhereIStop/state.md).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    (
      context.switchToHttp().getRequest<Request>() as unknown as {
        user: AuthenticatedUser;
      }
    ).user,
);
