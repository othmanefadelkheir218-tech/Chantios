import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Pipeline step 2: puts `tenant_id` (and `user_id`) from the JWT, already
 * resolved by `AuthGuard` into `req.user`, into `nestjs-cls` — this is what
 * the tenant-isolation Prisma extension reads
 * (common/prisma/tenant-extension.ts). Must run after `AuthGuard`. NOT
 * attached to any route yet.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    this.tenantContext.setTenantId(user.tenantId);
    this.tenantContext.setUserId(user.userId);
    return true;
  }
}
