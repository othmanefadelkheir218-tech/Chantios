import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';

/**
 * `payment_intent.payment_failed`: subscription -> `past_due`, NEVER
 * `cancelled` — `past_due` still allows access, so a failed card does not
 * lock a company out of its own data mid-month (doc/notes/subscription-plans.md).
 * Notifies the platform admin AND the tenant's own admin/manager.
 */
@Injectable()
export class HandlePaymentFailedHandler {
  constructor(
    @InjectPinoLogger(HandlePaymentFailedHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly tenants: TenantsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const intent = event.data.object as Stripe.PaymentIntent;
    const customerId =
      typeof intent.customer === 'string'
        ? intent.customer
        : intent.customer?.id;
    if (!customerId) {
      this.logger.warn(`${event.id}: payment_intent has no customer, ignored`);
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

    await this.subscriptions.setStatus(subscription.tenantId, 'past_due');

    const amount = (intent.amount / 100).toFixed(2);
    const tenant = await this.tenants.findOne(subscription.tenantId);
    await this.notifications.dispatch('payment_failed', {
      payload: {
        tenant_id: subscription.tenantId,
        company_name: tenant.name,
        amount,
      },
    });
    await this.notifications.dispatch('subscription_payment_failed', {
      tenantId: subscription.tenantId,
      dedupeDays: 1,
      payload: { amount },
    });

    this.logger.info(
      `Tenant ${subscription.tenantId} subscription past_due (payment of ${amount} failed)`,
    );
  }
}
