import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Who is doing the request — written into `audit_logs`. */
export interface RequestActor {
  adminUserId: number | null;
  ip: string | null;
}

/**
 * Reads the actor of the current request.
 * `req.user` is filled by AdminAuthGuard; the admin id is null on a route
 * without it.
 */
export function getRequestActor(req: Request): RequestActor {
  const user = (req as { user?: { id?: number } }).user;
  return { adminUserId: user?.id ?? null, ip: req.ip ?? null };
}

export const Actor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestActor =>
    getRequestActor(context.switchToHttp().getRequest<Request>()),
);
