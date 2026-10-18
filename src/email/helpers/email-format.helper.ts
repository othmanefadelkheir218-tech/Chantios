import type { EmailLocale } from '../templates/invite-employee.template';

/**
 * Money and dates in an email, in the reader's language (DESIGN.md § 5):
 * fr and nl `1 234,50 €`, en `€1,234.50`; dates `dd/mm/yyyy` everywhere.
 * `nl-BE` in Intl gives `€ 1.234,50`, so nl formats like fr-FR.
 */
const intlLocale = (locale: EmailLocale) =>
  locale === 'en' ? 'en-GB' : 'fr-FR';

const MONEY = /^-?\d+(\.\d+)?$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})(T|$)/;

/** `"10.00"` → `10,00 €` (fr/nl) or `€10.00` (en). Anything else is returned as it is. */
export function formatEmailMoney(value: string, locale: EmailLocale): string {
  if (!MONEY.test(value)) return value;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(Number(value))
    .replace(/\s/g, ' '); // no-break spaces from Intl -> normal spaces
}

/** `"2026-12-30"` (or an ISO date-time) → `30/12/2026`. Anything else is returned as it is. */
export function formatEmailDate(value: string): string {
  const match = DATE.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/** Payload keys that hold an amount in euros (`"10.00"`). */
export const MONEY_KEYS = [
  'amount',
  'amount_due',
  'balance_due',
  'plan_amount',
  'extra_amount',
  'tax_amount',
  'total',
] as const;

/** Payload keys that hold a calendar date (`"2026-12-30"`). */
export const DATE_KEYS = [
  'grace_ends_at',
  'trial_end',
  'start_date',
  'due_date',
  'date',
  'period_start',
  'period_end',
  'extra_period_start',
  'extra_period_end',
  'paid_at',
] as const;

/** A copy of the payload with its money and date values formatted for the email. */
export function formatEmailPayload(
  payload: Record<string, unknown>,
  locale: EmailLocale,
): Record<string, unknown> {
  const out = { ...payload };
  for (const key of MONEY_KEYS) {
    const value = out[key];
    if (typeof value === 'string' || typeof value === 'number') {
      out[key] = formatEmailMoney(String(value), locale);
    }
  }
  for (const key of DATE_KEYS) {
    const value = out[key];
    if (typeof value === 'string') out[key] = formatEmailDate(value);
  }
  return out;
}
