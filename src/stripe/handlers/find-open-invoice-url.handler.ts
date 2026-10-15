import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * The Stripe page of the unpaid invoice of a card subscription (step 21):
 * a `past_due` company pays what it owes there. `null` = nothing open.
 */
@Injectable()
export class FindOpenInvoiceUrlHandler {
  constructor(
    @InjectPinoLogger(FindOpenInvoiceUrlHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(subscriptionId: string): Promise<string | null> {
    try {
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        status: 'open',
        limit: 1,
      });
      return invoices.data[0]?.hosted_invoice_url ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to list open invoices of ${subscriptionId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
