/**
 * What our database keeps of a Stripe subscription (step 21). Built from a
 * `Stripe.Subscription` by `src/stripe/helpers/stripe-subscription.helper.ts`,
 * so this module never needs the Stripe types.
 */
export interface StripeSubscriptionState {
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  periodStart: Date;
  periodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
