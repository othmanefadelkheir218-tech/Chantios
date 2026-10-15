import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StripeSubscriptionState } from '../dto/stripe-subscription-state.dto';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * Stripe owns the period dates of a company that pays by card
 * (doc/notes/subscription-plans.md § Paying by card): copy them, with the
 * Stripe ids, the price and the cancel flag. A waiting plan change is due at
 * the end of the period, so its date follows the new `period_end`.
 * Never touches `status` — the payment events decide that.
 */
@Injectable()
export class SyncStripeSubscriptionHandler {
  constructor(
    @InjectPinoLogger(SyncStripeSubscriptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(tenantId: number, state: StripeSubscriptionState) {
    const updated = await this.subscriptions.setStripeSubscription(tenantId, {
      stripeSubscriptionId: state.stripeSubscriptionId,
      stripePriceId: state.stripePriceId,
      periodStart: state.periodStart,
      periodEnd: state.periodEnd,
      cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    });
    await this.subscriptions.movePendingPlanDate(tenantId, state.periodEnd);
    this.logger.info(
      `Tenant ${tenantId} synced from Stripe subscription ${state.stripeSubscriptionId}: ` +
        `period ends ${state.periodEnd.toISOString()}, cancel at period end = ${state.cancelAtPeriodEnd}`,
    );
    return updated;
  }
}
