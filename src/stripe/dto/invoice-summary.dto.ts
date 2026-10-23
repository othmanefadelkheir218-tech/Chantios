/**
 * A Stripe invoice reduced to what the billing history needs (step 21).
 * Amounts in cents. Dates in Unix seconds, as Stripe sends them.
 */
export type InvoiceLineSummary = {
  /** HT (prices are HT, step 27). */
  amount: number;
  /** The TVA on this line, in cents. */
  tax: number;
  /** Its TVA percent ("21.00"); `null` = no TVA, or a rate Stripe could not give back. */
  taxRate: string | null;
  /** 0 % "autoliquidation" (EU reverse charge). */
  reverseCharge: boolean;
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
