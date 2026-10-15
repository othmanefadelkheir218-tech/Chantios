import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { stripeIdOf } from '../helpers/stripe-subscription.helper';
import { RetrieveSubscriptionHandler } from './retrieve-subscription.handler';

/**
 * `checkout.session.completed` (step 21): the tenant admin finished the
 * Stripe card page. Save the new card subscription. Paid now → `active`
 * (clears the grace date, opens a blocked company). Paid during a trial →
 * the status stays `trialing`: the first charge is at the trial's end (Q1).
 */
@Injectable()
export class HandleCheckoutCompletedHandler {
  constructor(
    @InjectPinoLogger(HandleCheckoutCompletedHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly retrieveSubscription: RetrieveSubscriptionHandler,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== 'subscription') {
      this.logger.info(
        `${event.id}: checkout in ${session.mode} mode, ignored`,
      );
      return;
    }
    const tenantId = Number(
      session.client_reference_id ?? session.metadata?.tenant_id,
    );
    const subscriptionId = stripeIdOf(session.subscription);
    if (!tenantId || !subscriptionId) {
      this.logger.warn(
        `${event.id}: checkout has no tenant or subscription, ignored`,
      );
      return;
    }

    const { state, status } =
      await this.retrieveSubscription.execute(subscriptionId);
    await this.subscriptions.syncStripeSubscription(tenantId, state);
    if (status === 'active') {
      await this.subscriptions.setStatus(tenantId, 'active');
    }
    this.logger.info(
      `Tenant ${tenantId} now pays by card (Stripe subscription ${subscriptionId}, ${status})`,
    );
  }
}
