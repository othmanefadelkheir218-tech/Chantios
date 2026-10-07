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

    await this.subscriptions.setStatus(subscription.tenantId, 'cancelled');
    this.logger.info(
      `Tenant ${subscription.tenantId} subscription cancelled via Stripe`,
    );
  }
}
