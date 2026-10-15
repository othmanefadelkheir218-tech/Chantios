import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';
import { StripeSubscriptionState } from '../../subscriptions/dto/stripe-subscription-state.dto';
import { toSubscriptionState } from '../helpers/stripe-subscription.helper';

/**
 * Cancel (`true`) or keep (`false`) a card subscription at the end of the
 * paid month — never now, never a refund (step 21, Q6 + Q6b).
 */
@Injectable()
export class SetCancelAtPeriodEndHandler {
  constructor(
    @InjectPinoLogger(SetCancelAtPeriodEndHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    subscriptionId: string,
    cancel: boolean,
  ): Promise<StripeSubscriptionState> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancel,
      });
      this.logger.info(
        `Stripe subscription ${subscriptionId}: cancel at period end = ${cancel}`,
      );
      return toSubscriptionState(subscription);
    } catch (error) {
      this.logger.error(
        `Failed to set cancel_at_period_end on ${subscriptionId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }
}
