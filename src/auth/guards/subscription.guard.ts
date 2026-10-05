import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';

const ALLOWED_SUBSCRIPTION_STATUSES = new Set([
  'trialing',
  'active',
  'past_due',
]);

/**
 * Pipeline step 3: status check only — never counts resources. Blocks a
 * `suspended`/`banned` tenant, or a `cancelled` subscription
 * (doc/notes/subscription-plans.md). Must run after `TenantGuard`. NOT
 * attached to any route yet.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenants: TenantsService,
    private readonly subscriptions: SubscriptionsService,
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

    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (
      !subscription ||
      !ALLOWED_SUBSCRIPTION_STATUSES.has(subscription.status)
    ) {
      throw new ForbiddenException('No active subscription');
    }

    return true;
  }
}
