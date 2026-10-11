import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { ALLOW_LAPSED_SUBSCRIPTION_KEY } from '../decorators/allow-lapsed-subscription.decorator';

const ALLOWED_SUBSCRIPTION_STATUSES = new Set([
  'trialing',
  'active',
  'past_due',
]);

/** The message the frontend reads to show the "company blocked" page. */
export const SUBSCRIPTION_BLOCKED_MESSAGE = 'No active subscription';

/**
 * Pipeline step 4: status check only — never counts resources. Blocks a
 * `cancelled` subscription (doc/notes/subscription-plans.md), except on a
 * route marked `@AllowLapsedSubscription()` (the billing read routes). A
 * suspended or banned tenant is `TenantStatusGuard`'s job. Must run after
 * `TenantGuard`.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly subscriptions: SubscriptionsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new ForbiddenException('No tenant in context');
    }

    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription) {
      throw new ForbiddenException(SUBSCRIPTION_BLOCKED_MESSAGE);
    }
    if (ALLOWED_SUBSCRIPTION_STATUSES.has(subscription.status)) return true;

    const allowLapsed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_LAPSED_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowLapsed) return true;
    throw new ForbiddenException(SUBSCRIPTION_BLOCKED_MESSAGE);
  }
}
