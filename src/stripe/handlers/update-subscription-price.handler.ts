import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * A plan change of a company that pays by card (step 21, Q4): the new price
 * is set at once, with NO proration, so Stripe charges it from the next
 * invoice — the same date our `pending_plan_effective_at` applies the plan.
 */
@Injectable()
export class UpdateSubscriptionPriceHandler {
  constructor(
    @InjectPinoLogger(UpdateSubscriptionPriceHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(subscriptionId: string, priceId: string): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const item = subscription.items.data[0];
      if (!item) throw new Error('subscription has no item');
      if (item.price.id === priceId) return;
      await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: 'none',
      });
      this.logger.info(
        `Stripe subscription ${subscriptionId} moves to price ${priceId} from the next invoice`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to change the price of ${subscriptionId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
