import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { stripe } from '../../config/stripe.config';

/**
 * Ends an old card subscription at once, no refund, no last invoice — used
 * only before a BLOCKED company pays again, so the new month starts on the
 * payment day (step 21, Q8). Already ended in Stripe = nothing to do.
 */
@Injectable()
export class EndSubscriptionNowHandler {
  constructor(
    @InjectPinoLogger(EndSubscriptionNowHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.cancel(subscriptionId, {
        invoice_now: false,
        prorate: false,
      });
      this.logger.info(`Ended old Stripe subscription ${subscriptionId}`);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        (error.code === 'resource_missing' || /canceled/i.test(error.message))
      ) {
        this.logger.info(
          `Stripe subscription ${subscriptionId} was already ended`,
        );
        return;
      }
      this.logger.error(
        `Failed to end Stripe subscription ${subscriptionId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
