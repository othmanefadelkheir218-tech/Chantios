import { InvoiceSummary } from '../../stripe/dto/invoice-summary.dto';

/** Our period dates are copied from Stripe — a small margin only absorbs rounding. */
const MATCH_SECONDS = 60 * 60;

export type PeriodBillingStatus = 'paid' | 'due' | 'none';

/** What Stripe charged for one period. Amounts in euros, 2 decimals, as strings. */
export type PeriodBilling = {
  /** HT. */
  planAmount: string;
  /** HT. */
  extraAmount: string;
  /** Step 27 — Total HT = plan + extra. */
  subtotal: string;
  /** Step 27 — the TVA of every line of the period. */
  taxAmount: string;
  /** Step 27 — one TVA percent ("21.00"); `null` = none, or the period mixes rates. */
  taxRate: string | null;
  /** Step 27 — every taxed line is 0 % "autoliquidation". */
  reverseCharge: boolean;
  /** TTC: what the card was really charged (HT + TVA). */
  total: string;
  /** `paid` = every invoice involved is paid; `due` = one is not paid yet; `none` = nothing was charged. */
  status: PeriodBillingStatus;
  invoiceIds: string[];
};

const near = (a: number, b: number) => Math.abs(a - b) <= MATCH_SECONDS;
const euros = (cents: number) => (cents / 100).toFixed(2);

/**
 * The money of one period, from the Stripe invoices
 * (doc/notes/subscription-plans.md § The billing history). Stripe charges a
 * month in two parts on two invoices:
 * - the plan line, on the invoice made at the START of the month (the line's own period starts then);
 * - the overage lines, on the invoice made at the END of the month (that invoice's period is the month that ended).
 */
export function periodBilling(
  periodStart: Date,
  invoices: InvoiceSummary[],
): PeriodBilling {
  const start = Math.floor(periodStart.getTime() / 1000);
  let plan = 0;
  let extra = 0;
  let tax = 0;
  const rates = new Set<string>();
  const taxed: boolean[] = [];
  const used = new Map<string, string>();

  for (const invoice of invoices) {
    for (const line of invoice.lines) {
      const counts =
        line.kind === 'plan'
          ? near(line.periodStart, start)
          : near(invoice.periodStart, start);
      if (!counts) continue;
      if (line.kind === 'plan') plan += line.amount;
      else extra += line.amount;
      tax += line.tax;
      if (line.taxRate !== null) {
        rates.add(line.taxRate);
        taxed.push(line.reverseCharge);
      }
      used.set(invoice.id, invoice.status);
    }
  }

  const statuses = [...used.values()];
  const status: PeriodBillingStatus =
    statuses.length === 0
      ? 'none'
      : statuses.every((s) => s === 'paid')
        ? 'paid'
        : 'due';

  return {
    planAmount: euros(plan),
    extraAmount: euros(extra),
    subtotal: euros(plan + extra),
    taxAmount: euros(tax),
    taxRate: rates.size === 1 ? [...rates][0] : null,
    reverseCharge: taxed.length > 0 && taxed.every(Boolean),
    total: euros(plan + extra + tax),
    status,
    invoiceIds: [...used.keys()],
  };
}
