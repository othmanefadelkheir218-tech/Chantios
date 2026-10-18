import Stripe from 'stripe';

/** The money of one paid Stripe invoice, for the payment email. Euros as `"10.00"`, dates as `YYYY-MM-DD`. */
export type InvoiceReceipt = {
  invoice_number: string | null;
  paid_at: string;
  plan_amount: string;
  /** The month the plan line pays for (paid at its START). */
  period_start: string | null;
  period_end: string | null;
  extra_amount: string;
  /** The month the overage belongs to (the month that ended). */
  extra_period_start: string | null;
  extra_period_end: string | null;
  tax_amount: string;
  total: string;
};

const euros = (cents: number) => (cents / 100).toFixed(2);
const day = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(0, 10);

/**
 * Splits a paid invoice into plan + extra (doc/notes/subscription-plans.md
 * § The payment email). Same split as the billing history: a subscription
 * line is the plan; any other line is an invoice item = overage. The overage
 * of a cycle invoice belongs to the invoice's own period (the month that ended).
 */
export function invoiceReceipt(invoice: Stripe.Invoice): InvoiceReceipt {
  let plan = 0;
  let extra = 0;
  let planPeriod: Stripe.InvoiceLineItem['period'] | null = null;

  for (const line of invoice.lines.data) {
    if (line.parent?.type === 'subscription_item_details') {
      plan += line.amount;
      planPeriod ??= line.period;
    } else {
      extra += line.amount;
    }
  }

  const tax = invoice.total - (invoice.total_excluding_tax ?? invoice.total);
  const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;

  return {
    invoice_number: invoice.number,
    paid_at: day(paidAt),
    plan_amount: euros(plan),
    period_start: planPeriod ? day(planPeriod.start) : null,
    period_end: planPeriod ? day(planPeriod.end) : null,
    extra_amount: euros(extra),
    extra_period_start: extra > 0 ? day(invoice.period_start) : null,
    extra_period_end: extra > 0 ? day(invoice.period_end) : null,
    tax_amount: euros(Math.max(0, tax)),
    total: euros(invoice.amount_paid),
  };
}
