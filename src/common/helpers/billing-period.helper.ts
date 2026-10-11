/**
 * Every plan is billed monthly (`CreatePlanPriceHandler` always creates a
 * `recurring: { interval: 'month' }` Stripe Price — doc/notes/subscription-plans.md
 * has no other cycle length). This is the one place a billing period rolls
 * forward, used by both the Stripe `payment_intent.succeeded` handler and the
 * renewal job, so the two can never disagree on the cycle length.
 */
export function addOneMonth(date: Date): Date {
  // UTC, never the server's local time: a local-time `setMonth` moves the
  // hour whenever a clock change falls inside the month (13:43 became 14:43).
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  // Last day of the target month: 31 Jan + 1 month = 28/29 Feb, not 3 March.
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const next = new Date(date);
  next.setUTCMonth(month, Math.min(date.getUTCDate(), lastDay));
  return next;
}
