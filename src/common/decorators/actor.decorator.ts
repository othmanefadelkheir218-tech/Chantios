import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Who is doing the request — written into `audit_logs`. */
export interface RequestActor {
  adminUserId: string | null;
  ip: string | null;
}

/**
 * Reads the actor of the current request.
 * TODO: step 02 — `req.user` is filled by AdminAuthGuard. Until then the
 * admin id is always null.
 */
export function getRequestActor(req: Request): RequestActor {
  const user = (req as { user?: { id?: string } }).user;
  return { adminUserId: user?.id ?? null, ip: req.ip ?? null };
}

export const Actor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestActor =>
    getRequestActor(context.switchToHttp().getRequest<Request>()),
);
