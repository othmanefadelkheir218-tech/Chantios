import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { BillingService } from '../../billing/billing.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { stripeIdOf } from '../helpers/stripe-subscription.helper';

/**
 * `invoice.created` for a monthly card invoice (step 21, Q2). Stripe keeps
 * the new invoice as a draft for about an hour: the renewal runs now, so
 * the overage of the month that just ended lands on THIS invoice.
 * `period_start`/`period_end` of a subscription invoice are the month that
 * ended — the one the usage belongs to.
 *
 * `BillingService` comes from `ModuleRef` (`strict: false`), not from a
 * module import: `BillingModule` already imports `StripeModule`.
 */
@Injectable()
export class HandleInvoiceCreatedHandler {
  constructor(
    @InjectPinoLogger(HandleInvoiceCreatedHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.billing_reason !== 'subscription_cycle') return;

    const subscriptionId = stripeIdOf(
      invoice.parent?.subscription_details?.subscription,
    );
    if (!subscriptionId) return;
    const local =
      await this.subscriptions.findByStripeSubscriptionId(subscriptionId);
    if (!local) {
      this.logger.warn(
        `${event.id}: no company for Stripe subscription ${subscriptionId}`,
      );
      return;
    }

    // Only a draft can take a new line; otherwise the overage waits for the next invoice.
    const invoiceId = invoice.status === 'draft' ? (invoice.id ?? null) : null;
    const billing = this.moduleRef.get(BillingService, { strict: false });
    await billing.renewForStripeInvoice(local.tenantId, {
      invoiceId,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    });
  }
}
