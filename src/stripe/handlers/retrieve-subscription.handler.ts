import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';
import { StripeSubscriptionState } from '../../subscriptions/dto/stripe-subscription-state.dto';
import { toSubscriptionState } from '../helpers/stripe-subscription.helper';

/** A card subscription as Stripe has it now (step 21). */
@Injectable()
export class RetrieveSubscriptionHandler {
  constructor(
    @InjectPinoLogger(RetrieveSubscriptionHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(subscriptionId: string): Promise<{
    state: StripeSubscriptionState;
    status: string;
  }> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return {
        state: toSubscriptionState(subscription),
        status: subscription.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to read Stripe subscription ${subscriptionId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
