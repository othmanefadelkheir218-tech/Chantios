import { env } from '../../config/env.config';

export const BILLING_LOCALES = ['fr', 'en', 'nl'] as const;
export type BillingLocale = (typeof BILLING_LOCALES)[number];

/** Stripe refuses a Checkout trial that ends less than 48 hours from now. */
const MIN_CHECKOUT_TRIAL_MS = 48 * 60 * 60 * 1000 + 5 * 60 * 1000;

/**
 * Q1 (step 21): paying during a trial keeps the free days — the first charge
 * is at the trial's end. With less than 48 hours left, Stripe's minimum wins
 * (at most 2 extra free days). Unix seconds, as Stripe wants it.
 */
export function checkoutTrialEnd(periodEnd: Date, now: Date): number {
  const end = Math.max(
    periodEnd.getTime(),
    now.getTime() + MIN_CHECKOUT_TRIAL_MS,
  );
  return Math.floor(end / 1000);
}

/** The dev tools give a company a FAKE customer (`cus_dev_<id>`) that Stripe does not know. */
export function isRealStripeCustomer(
  customerId: string | null,
): customerId is string {
  return !!customerId && !customerId.startsWith('cus_dev_');
}

/** The tenant's Billing page — where Stripe sends the tenant admin back. */
export function billingPageUrl(
  locale: BillingLocale,
  checkout?: 'success' | 'cancel',
): string {
  const base = `${env.APP_URL.replace(/\/$/, '')}/${locale}/settings/billing`;
  return checkout ? `${base}?checkout=${checkout}` : base;
}
