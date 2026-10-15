import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

/**
 * `customer.subscription.deleted`: subscription -> `cancelled`. From here
 * `SubscriptionGuard` blocks every tenant-side request.
 */
@Injectable()
export class HandleSubscriptionDeletedHandler {
  constructor(
    @InjectPinoLogger(HandleSubscriptionDeletedHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
    if (!customerId) {
      this.logger.warn(`${event.id}: subscription has no customer, ignored`);
      return;
    }

    const subscription =
      await this.subscriptions.findByStripeCustomerId(customerId);
    if (!subscription) {
      this.logger.warn(
        `${event.id}: no subscription for Stripe customer ${customerId}`,
      );
      return;
    }

    // An OLD card subscription ended (a blocked company paid again, step 21):
    // the company already has a newer one — nothing to block.
    if (
      subscription.stripeSubscriptionId &&
      subscription.stripeSubscriptionId !== sub.id
    ) {
      this.logger.info(
        `${event.id}: old Stripe subscription ${sub.id} ended, tenant ${subscription.tenantId} has a newer one — ignored`,
      );
      return;
    }

    await this.subscriptions.setStatus(subscription.tenantId, 'cancelled');
    if (subscription.stripeSubscriptionId) {
      await this.subscriptions.clearStripeSubscription(subscription.tenantId);
    }
    this.logger.info(
      `Tenant ${subscription.tenantId} subscription cancelled via Stripe`,
    );
  }
}
