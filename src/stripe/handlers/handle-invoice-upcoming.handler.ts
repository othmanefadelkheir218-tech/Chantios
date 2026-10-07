import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

/** `invoice.upcoming`: a warning email to the tenant's own admin/manager. */
@Injectable()
export class HandleInvoiceUpcomingHandler {
  constructor(
    @InjectPinoLogger(HandleInvoiceUpcomingHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;
    if (!customerId) {
      this.logger.warn(`${event.id}: invoice has no customer, ignored`);
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

    await this.notifications.dispatch('subscription_renewal_upcoming', {
      tenantId: subscription.tenantId,
      dedupeDays: 3,
      payload: {
        amount_due: (invoice.amount_due / 100).toFixed(2),
        period_end: subscription.periodEnd.toISOString().slice(0, 10),
      },
    });

    this.logger.info(
      `Tenant ${subscription.tenantId} notified of an upcoming renewal charge`,
    );
  }
}
