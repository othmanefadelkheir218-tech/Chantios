import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * The Stripe Customer Portal: change the card, see the Stripe invoices
 * (step 21, Q5). What the portal allows is set once in the Stripe Dashboard.
 */
@Injectable()
export class CreatePortalSessionHandler {
  constructor(
    @InjectPinoLogger(CreatePortalSessionHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    customerId: string,
    locale: 'fr' | 'en' | 'nl',
    returnUrl: string,
  ): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        locale,
        return_url: returnUrl,
      });
      this.logger.info(`Portal session for Stripe customer ${customerId}`);
      return session.url;
    } catch (error) {
      this.logger.error(
        `Failed to open the Stripe portal for ${customerId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
