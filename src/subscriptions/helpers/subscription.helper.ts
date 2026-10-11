import { Prisma, SubscriptionStatus } from '@prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;

/** doc/notes/subscription-plans.md: 7 days to pay after a trial ends or a payment fails. */
export const TRIAL_GRACE_DAYS = 7;
/** ... and the reminder goes out 3 days before the trial ends (day 11 of 14). */
export const TRIAL_REMINDER_DAYS = 3;

/** The day a company is blocked if it has not paid, counted from `from`. */
export function graceEndOf(from: Date): Date {
  return new Date(from.getTime() + TRIAL_GRACE_DAYS * DAY_MS);
}

/** A trial that ends within the reminder window (and has not ended yet). */
export function isTrialEndingSoon(
  status: SubscriptionStatus,
  periodEnd: Date,
  now: Date,
): boolean {
  const left = periodEnd.getTime() - now.getTime();
  return (
    status === 'trialing' && left > 0 && left <= TRIAL_REMINDER_DAYS * DAY_MS
  );
}

/** A grace period (trial end or failed payment) that has run out without a payment. */
export function isGraceOver(
  status: SubscriptionStatus,
  graceEndsAt: Date | null,
  now: Date,
): boolean {
  return status === 'past_due' && graceEndsAt !== null && graceEndsAt <= now;
}

/** A blocked (`cancelled`) company is never billed: renewal skips it. */
export function isBilled(status: SubscriptionStatus): boolean {
  return status !== 'cancelled';
}

/** `date` moved `days` earlier — the dev tools' "as if N days passed". `null` stays `null`. */
export function shiftBack<T extends Date | null>(date: T, days: number): T {
  return (date === null ? null : new Date(date.getTime() - days * DAY_MS)) as T;
}

/** `max(0, actual - allowance) × rate`, rounded to 2 decimals. */
export function computeOverageAmount(
  actualCount: number,
  includedAllowance: number,
  overageRate: Prisma.Decimal.Value,
): Prisma.Decimal {
  const over = new Prisma.Decimal(actualCount).minus(includedAllowance);
  if (over.lte(0)) return new Prisma.Decimal(0);
  return over.times(overageRate).toDecimalPlaces(2);
}
