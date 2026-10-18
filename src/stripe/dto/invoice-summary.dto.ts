/**
 * A Stripe invoice reduced to what the billing history needs (step 21).
 * Amounts in cents. Dates in Unix seconds, as Stripe sends them.
 */
export type InvoiceLineSummary = {
  amount: number;
  /** `plan` = the monthly price (paid at the START of its month); `extra` = an invoice item (overage). */
  kind: 'plan' | 'extra';
  periodStart: number;
};

export type InvoiceSummary = {
  id: string;
  status: string;
  /** For a cycle invoice: the month that just ended — its overage is billed here. */
  periodStart: number;
  lines: InvoiceLineSummary[];
};
