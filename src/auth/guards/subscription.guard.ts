import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

const ALLOWED_SUBSCRIPTION_STATUSES = new Set([
  'trialing',
  'active',
  'past_due',
]);

/**
 * Pipeline step 4: status check only — never counts resources. Blocks a
 * `cancelled` subscription (doc/notes/subscription-plans.md). A suspended or
 * banned tenant is `TenantStatusGuard`'s job. Must run after `TenantGuard`.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async canActivate(): Promise<boolean> {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new ForbiddenException('No tenant in context');
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
