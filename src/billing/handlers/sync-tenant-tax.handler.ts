import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { isRealStripeCustomer } from '../helpers/card-payment.helper';
import { TenantVatHandler } from './tenant-vat.handler';

export type TaxSyncResult = 'synced' | 'no_stripe_customer' | 'missing';

/**
 * Step 27 — puts one company's TVA on Stripe (subscription TaxRate, TVA
 * number, reverse-charge footer), from its NEXT invoice. Called by the
 * background job after a country / TVA number change (C4) or a rate change
 * (C5), and by `yarn tva:sync` (C6). A company with no TVA (`missing`) is
 * left as it is in Stripe and reported. Throws when Stripe fails (job retries).
 */
@Injectable()
export class SyncTenantTaxHandler {
  constructor(
    @InjectPinoLogger(SyncTenantTaxHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly tenantVat: TenantVatHandler,
    private readonly stripe: StripeService,
  ) {}

  async execute(tenantId: number): Promise<TaxSyncResult> {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!isRealStripeCustomer(subscription.stripeCustomerId)) {
      return 'no_stripe_customer';
    }
    const { vat, euVatNumber } = await this.tenantVat.withNumber(tenantId);
    if (vat.kind === 'missing') {
      this.logger.warn(
        `Tenant ${tenantId} has no TVA (${vat.reason}): Stripe left as it is`,
      );
      return 'missing';
    }

    this.logger.info(
      `Syncing the Stripe TVA of tenant ${tenantId}: ${vat.kind} ${vat.rate}%`,
    );
    await this.stripe.syncSubscriptionTax({
      customerId: subscription.stripeCustomerId,
      subscriptionId: subscription.stripeSubscriptionId,
      taxRateId: vat.stripeTaxRateId,
      reverseCharge: vat.kind === 'reverse_charge',
      euVatNumber,
    });
    return 'synced';
  }

  /** `yarn tva:sync`: every card subscription. One failure never stops the others. */
  async executeAll(): Promise<Record<TaxSyncResult | 'failed', number[]>> {
    const result: Record<TaxSyncResult | 'failed', number[]> = {
      synced: [],
      no_stripe_customer: [],
      missing: [],
      failed: [],
    };
    for (const tenantId of await this.subscriptions.findCardTenantIds()) {
      try {
        result[await this.execute(tenantId)].push(tenantId);
      } catch (error) {
        this.logger.error(
          `TVA sync failed for tenant ${tenantId}: ${String(error)}`,
        );
        result.failed.push(tenantId);
      }
    }
    return result;
  }
}
