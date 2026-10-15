import Stripe from 'stripe';
import { StripeSubscriptionState } from '../../subscriptions/dto/stripe-subscription-state.dto';

/** A Stripe field that is an id or an expanded object → its id. */
export function stripeIdOf(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

/**
 * What we keep of a Stripe subscription (step 21). Since API `2025-03-31`
 * the period dates live on the subscription ITEM, not on the subscription.
 * Every card subscription here has exactly one item: the plan's price.
 */
export function toSubscriptionState(
  subscription: Stripe.Subscription,
): StripeSubscriptionState {
  const item = subscription.items.data[0];
  if (!item) {
    throw new Error(`Stripe subscription ${subscription.id} has no item`);
  }
  return {
    stripeSubscriptionId: subscription.id,
    stripePriceId: item.price?.id ?? null,
    periodStart: new Date(item.current_period_start * 1000),
    periodEnd: new Date(item.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}
