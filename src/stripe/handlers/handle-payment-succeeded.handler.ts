import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { addOneMonth } from '../../common/helpers/billing-period.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';

/**
 * `payment_intent.succeeded`: subscription -> `active`, the billing cycle
 * rolls forward one month (doc/notes/subscription-plans.md — every plan is
 * billed monthly), platform admin notified.
 */
@Injectable()
export class HandlePaymentSucceededHandler {
  constructor(
    @InjectPinoLogger(HandlePaymentSucceededHandler.name)
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

    const periodStart = new Date();
    const periodEnd = addOneMonth(periodStart);
    await this.subscriptions.setStatus(subscription.tenantId, 'active');
    await this.subscriptions.setPeriod(
      subscription.tenantId,
      periodStart,
      periodEnd,
    );

    const tenant = await this.tenants.findOne(subscription.tenantId);
    await this.notifications.dispatch('payment_received', {
      payload: {
        tenant_id: subscription.tenantId,
        company_name: tenant.name,
        amount: (intent.amount_received / 100).toFixed(2),
      },
    });

    this.logger.info(
      `Tenant ${subscription.tenantId} subscription active, period rolled to ${periodEnd.toISOString()}`,
    );
  }
}
