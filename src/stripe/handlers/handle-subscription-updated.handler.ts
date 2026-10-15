import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { RetrieveSubscriptionHandler } from './retrieve-subscription.handler';

/**
 * `customer.subscription.updated` (step 21): Stripe moved the period, the
 * price or the cancel flag. Stripe owns these dates (Q3), so copy them.
 * Reads the subscription again: events can arrive out of order, the latest
 * state is the only one worth keeping.
 */
@Injectable()
export class HandleSubscriptionUpdatedHandler {
  constructor(
    @InjectPinoLogger(HandleSubscriptionUpdatedHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly retrieveSubscription: RetrieveSubscriptionHandler,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const { id } = event.data.object as Stripe.Subscription;
    const local = await this.subscriptions.findByStripeSubscriptionId(id);
    if (!local) {
      this.logger.info(
        `${event.id}: Stripe subscription ${id} is not (yet) ours, ignored`,
      );
      return;
    }
    const { state } = await this.retrieveSubscription.execute(id);
    await this.subscriptions.syncStripeSubscription(local.tenantId, state);
  }
}
