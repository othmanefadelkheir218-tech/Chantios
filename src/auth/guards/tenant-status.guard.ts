import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { TenantsService } from '../../tenants/tenants.service';

/**
 * Blocks a `suspended`/`banned` tenant (doc/notes/subscription-plans.md).
 * The one place that rule lives — both `@TenantAuth()` and `@SessionAuth()`
 * use it, so a suspended company is locked out of every tenant route, even
 * with an access cookie issued before the suspension. Must run after
 * `TenantGuard`.
 */
@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenants: TenantsService,
  ) {}

  async canActivate(): Promise<boolean> {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new ForbiddenException('No tenant in context');
    }

    const tenant = await this.tenants.findOne(tenantId);
    if (tenant.status !== 'active') {
      throw new ForbiddenException('This company is suspended or banned');
    }

    return true;
  }
}
