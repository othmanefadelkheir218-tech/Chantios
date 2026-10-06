import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PermissionScope as Scope } from '@prisma/client';
import type { Request } from 'express';

/**
 * Reads `req.permissionScope` ('all' | 'own'), set by `PermissionGuard` after
 * resolving the caller's role + module permission (src/auth/guards/permission.guard.ts).
 * First consumer: the media module's list route — a `worker` (scope `own` by
 * default on `media`) only sees their own uploads.
 */
export const PermissionScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Scope =>
    (
      context.switchToHttp().getRequest<Request>() as unknown as {
        permissionScope: Scope;
      }
    ).permissionScope,
);
