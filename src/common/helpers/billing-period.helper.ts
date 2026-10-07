/**
 * Every plan is billed monthly (`CreatePlanPriceHandler` always creates a
 * `recurring: { interval: 'month' }` Stripe Price — doc/notes/subscription-plans.md
 * has no other cycle length). This is the one place a billing period rolls
 * forward, used by both the Stripe `payment_intent.succeeded` handler and the
 * renewal job, so the two can never disagree on the cycle length.
 */
export function addOneMonth(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}
