import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';
import { CheckoutSessionInput } from '../dto/checkout-session.dto';

/**
 * A Stripe Checkout page in `subscription` mode: the tenant admin enters a
 * card, Stripe creates the subscription (doc/notes/subscription-plans.md
 * § Paying by card). The result comes back by webhook
 * (`checkout.session.completed`). Returns the page URL.
 */
@Injectable()
export class CreateCheckoutSessionHandler {
  constructor(
    @InjectPinoLogger(CreateCheckoutSessionHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(input: CheckoutSessionInput): Promise<string> {
    const tenantId = String(input.tenantId);
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        // Stripe "Managed Payments" (Stripe handles VAT) is on by default on
        // new accounts. We set the TVA ourselves with a TaxRate (step 27, Q1),
        // so it stays off.
        managed_payments: { enabled: false },
        customer: input.customerId,
        client_reference_id: tenantId,
        metadata: { tenant_id: tenantId },
        line_items: [{ price: input.priceId, quantity: 1 }],
        // Always take the card, even when the first charge is at the trial's end.
        payment_method_collection: 'always',
        subscription_data: {
          metadata: { tenant_id: tenantId },
          // Step 27: TVA on top of the HT price, on every invoice of it.
          default_tax_rates: [input.taxRateId],
          ...(input.trialEnd && { trial_end: input.trialEnd }),
        },
        locale: input.locale,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });
      if (!session.url) throw new Error('Checkout session has no url');
      this.logger.info(
        `Checkout session ${session.id} for tenant ${tenantId} (price ${input.priceId}, tax rate ${input.taxRateId})`,
      );
      return session.url;
    } catch (error) {
      this.logger.error(
        `Failed to create a Checkout session for tenant ${tenantId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
