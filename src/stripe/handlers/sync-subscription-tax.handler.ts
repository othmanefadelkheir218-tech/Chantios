import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/** The legal mention on a reverse-charge invoice (doc/notes/subscription-plans.md § TVA on the subscription). */
export const REVERSE_CHARGE_FOOTER =
  'Autoliquidation — article 196 de la directive 2006/112/CE';

export interface SubscriptionTaxInput {
  customerId: string;
  /** null = no card subscription yet: only the customer is updated. */
  subscriptionId: string | null;
  /** The resolved Stripe TaxRate (normal or reverse charge). */
  taxRateId: string;
  reverseCharge: boolean;
  /** An EU TVA number ("BE0123456789"), printed on the invoice. null = none. */
  euVatNumber: string | null;
}

/**
 * Step 27 — puts a company's TVA on Stripe, from its NEXT invoice (invoices
 * already made keep theirs):
 *   - subscription `default_tax_rates` = the resolved TaxRate;
 *   - customer TVA number (`eu_vat` tax id), so it prints on the invoice;
 *   - customer invoice footer = the reverse-charge mention, or cleared.
 * Throws 502 when Stripe fails (the job retries). The tax id alone is
 * best-effort: Stripe refuses a number it finds malformed, and that must not
 * stop the rate from being right.
 */
@Injectable()
export class SyncSubscriptionTaxHandler {
  constructor(
    @InjectPinoLogger(SyncSubscriptionTaxHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(input: SubscriptionTaxInput): Promise<void> {
    const { customerId, subscriptionId, taxRateId } = input;
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          footer: input.reverseCharge ? REVERSE_CHARGE_FOOTER : '',
        },
      });
      if (subscriptionId) {
        await stripe.subscriptions.update(subscriptionId, {
          default_tax_rates: [taxRateId],
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync the TVA of Stripe customer ${customerId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
    await this.syncTaxId(customerId, input.euVatNumber);
    this.logger.info(
      `Stripe TVA synced for customer ${customerId}: tax rate ${taxRateId}` +
        `${input.reverseCharge ? ' (reverse charge)' : ''}` +
        `${subscriptionId ? `, subscription ${subscriptionId}` : ''}`,
    );
  }

  /** Exactly one `eu_vat` tax id on the customer: the company's number, or none. */
  private async syncTaxId(
    customerId: string,
    euVatNumber: string | null,
  ): Promise<void> {
    try {
      const existing = await stripe.customers.listTaxIds(customerId, {
        limit: 100,
      });
      const euIds = existing.data.filter((id) => id.type === 'eu_vat');
      if (euIds.some((id) => id.value === euVatNumber) && euIds.length === 1) {
        return;
      }
      for (const id of euIds) {
        await stripe.customers.deleteTaxId(customerId, id.id);
      }
      if (euVatNumber) {
        await stripe.customers.createTaxId(customerId, {
          type: 'eu_vat',
          value: euVatNumber,
        });
      }
    } catch (error) {
      this.logger.warn(
        `TVA number not set on Stripe customer ${customerId}: ${String(error)}`,
      );
    }
  }
}
