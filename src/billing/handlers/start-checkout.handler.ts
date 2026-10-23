import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlansService } from '../../plans/plans.service';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { CardPaymentDto } from '../dto/card-payment.dto';
import { TenantVatHandler } from './tenant-vat.handler';
import {
  billingPageUrl,
  checkoutTrialEnd,
  isRealStripeCustomer,
} from '../helpers/card-payment.helper';

/**
 * `POST /api/billing/checkout` — the tenant admin's "Pay" button
 * (doc/notes/subscription-plans.md § Paying by card). Returns the Stripe
 * page to open:
 *   - no card subscription → a Checkout page (trial kept, Q1);
 *   - card subscription, `past_due` → the unpaid Stripe invoice;
 *   - card subscription, `cancelled` (blocked) → the old one is ended, then a
 *     new Checkout, so the new month starts on the payment day (Q8);
 *   - card subscription, `trialing`/`active` → 409: use "Manage payment".
 * Step 27: no TVA for this company (no country, or not an active TVA
 * country) → 409, nothing else happens. The Checkout subscription gets the
 * resolved TaxRate; the customer its TVA number and reverse-charge footer.
 */
@Injectable()
export class StartCheckoutHandler {
  constructor(
    @InjectPinoLogger(StartCheckoutHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly tenants: TenantsService,
    private readonly stripe: StripeService,
    private readonly tenantVat: TenantVatHandler,
  ) {}

  async execute(
    tenantId: number,
    { locale }: CardPaymentDto,
  ): Promise<{ url: string }> {
    this.logger.info(`Tenant ${tenantId} starts a card payment`);
    const { vat, euVatNumber } = await this.tenantVat.withNumber(tenantId);
    if (vat.kind === 'missing') {
      this.logger.warn(`Tenant ${tenantId} cannot pay: no TVA (${vat.reason})`);
      throw new ConflictException(
        vat.reason === 'no_country'
          ? 'Fill in your company country first'
          : 'Your country is not supported yet',
      );
    }
    const subscription = await this.subscriptions.findByTenant(tenantId);

    if (subscription.stripeSubscriptionId) {
      if (subscription.status === 'past_due') {
        const url = await this.stripe.findOpenInvoiceUrl(
          subscription.stripeSubscriptionId,
        );
        if (!url) {
          throw new ConflictException(
            'Nothing to pay right now — Stripe will try the card again',
          );
        }
        this.logger.info(
          `Tenant ${tenantId} sent to its unpaid Stripe invoice`,
        );
        return { url };
      }
      if (subscription.status !== 'cancelled') {
        throw new ConflictException(
          'This company already pays by card — use "Manage payment"',
        );
      }
      await this.stripe.endSubscriptionNow(subscription.stripeSubscriptionId);
      await this.subscriptions.clearStripeSubscription(tenantId);
    }

    // A waiting plan change is the plan they will be on: pay that one.
    const plan = await this.plans.findOne(
      subscription.pendingPlanId ?? subscription.planId,
    );
    if (!plan.stripePriceId) {
      this.logger.warn(
        `Tenant ${tenantId}: plan ${plan.id} has no Stripe price`,
      );
      throw new ConflictException(
        'This plan cannot be paid by card — contact support',
      );
    }

    let customerId = subscription.stripeCustomerId;
    if (!isRealStripeCustomer(customerId)) {
      const tenant = await this.tenants.findOne(tenantId);
      customerId = await this.stripe.createCustomer(
        tenantId,
        tenant.name,
        tenant.email,
      );
      await this.subscriptions.setStripeCustomerId(tenantId, customerId);
    }

    // The customer first: its invoices print the TVA number / reverse-charge mention.
    await this.stripe.syncSubscriptionTax({
      customerId,
      subscriptionId: null,
      taxRateId: vat.stripeTaxRateId,
      reverseCharge: vat.kind === 'reverse_charge',
      euVatNumber,
    });
    const url = await this.stripe.createCheckoutSession({
      tenantId,
      customerId,
      priceId: plan.stripePriceId,
      taxRateId: vat.stripeTaxRateId,
      trialEnd:
        subscription.status === 'trialing'
          ? checkoutTrialEnd(subscription.periodEnd, new Date())
          : undefined,
      locale,
      successUrl: billingPageUrl(locale, 'success'),
      cancelUrl: billingPageUrl(locale, 'cancel'),
    });
    return { url };
  }
}
