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

/**
 * Who PERFORMS an action, as far as the shared business handlers care: a
 * tenant user, or — `userId: null` — the client acting from the portal (a
 * client has no `users` row). It is the supertype of `AuthenticatedUser`, so
 * every existing caller still compiles. The quote accept / refuse chain
 * (quotes → projects → stock) only ever reads `tenantId` and `userId`, which
 * is what lets the portal and a staff member call the SAME handler.
 */
export interface ActingParty {
  userId: number | null;
  tenantId: number;
}
