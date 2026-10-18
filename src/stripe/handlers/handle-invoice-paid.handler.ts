import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import {
  BILLING_LOCALES,
  BillingLocale,
  billingPageUrl,
} from '../../billing/helpers/card-payment.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { PlansService } from '../../plans/plans.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { invoiceReceipt } from '../helpers/invoice-receipt.helper';

/**
 * `invoice.paid`: the company's admin gets a "payment received" email with
 * the detail — plan (+ its period), extra usage (+ the month it covers),
 * VAT, total (doc/notes/subscription-plans.md § The payment email). An
 * invoice of 0 € (the trial) sends nothing.
 *
 * `PlansService` comes from `ModuleRef` (`strict: false`), not from a module
 * import: `PlansModule` already imports `StripeModule`.
 */
@Injectable()
export class HandleInvoicePaidHandler {
  constructor(
    @InjectPinoLogger(HandleInvoicePaidHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly tenants: TenantsService,
    private readonly notifications: NotificationsService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    if (invoice.amount_paid <= 0) return;

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

    const tenant = await this.tenants.findOne(subscription.tenantId);
    const plans = this.moduleRef.get(PlansService, { strict: false });
    const plan = await plans.findOne(subscription.planId);
    const locale: BillingLocale = (
      BILLING_LOCALES as readonly string[]
    ).includes(tenant.locale)
      ? (tenant.locale as BillingLocale)
      : 'en';

    await this.notifications.dispatch('subscription_payment_received', {
      tenantId: subscription.tenantId,
      payload: {
        ...invoiceReceipt(invoice),
        plan_name: plan.name,
        billing_url: billingPageUrl(locale),
      },
    });

    this.logger.info(
      `Tenant ${subscription.tenantId} sent the receipt of Stripe invoice ${invoice.id}`,
    );
  }
}
