import Stripe from 'stripe';

/** What we need to know about one Stripe TaxRate (its percent never changes). */
export type TaxRateInfo = {
  /** Percent, 2 decimals ("21.00"). */
  percentage: string;
  /** Our 0 % "TVA autoliquidation" rate (step 27). */
  reverseCharge: boolean;
};

/** The display name of the reverse-charge TaxRates we create (`CreateTaxRateHandler`). */
export const REVERSE_CHARGE_DISPLAY_NAME = 'TVA autoliquidation';

/** The TVA of a set of lines: one rate, or `null` when they mix rates or have none. */
export type TaxLabel = { rate: string | null; reverseCharge: boolean };

/** Tax of one invoice line (Stripe "dahlia": `line.taxes[]`), in cents, with its TaxRate ids. */
export function lineTax(line: Stripe.InvoiceLineItem): {
  amount: number;
  rateIds: string[];
} {
  const taxes = line.taxes ?? [];
  return {
    amount: taxes.reduce((sum, tax) => sum + tax.amount, 0),
    rateIds: taxes
      .map((tax) => tax.tax_rate_details?.tax_rate)
      .filter((id): id is string => typeof id === 'string'),
  };
}

/** Every TaxRate id used on these invoices' lines. */
export function invoiceTaxRateIds(invoices: Stripe.Invoice[]): string[] {
  const ids = new Set<string>();
  for (const invoice of invoices) {
    for (const line of invoice.lines.data) {
      for (const id of lineTax(line).rateIds) ids.add(id);
    }
  }
  return [...ids];
}

/**
 * One label for a group of TaxRates. No rate → `rate: null`. Several
 * different percents (the rate changed between two invoices of a period) →
 * `rate: null` too: the amount is shown without a single rate.
 */
export function taxLabel(
  rateIds: string[],
  infos: Map<string, TaxRateInfo>,
): TaxLabel {
  const known = rateIds
    .map((id) => infos.get(id))
    .filter((info): info is TaxRateInfo => !!info);
  const percents = new Set(known.map((info) => info.percentage));
  return {
    rate: percents.size === 1 ? [...percents][0] : null,
    reverseCharge: known.length > 0 && known.every((i) => i.reverseCharge),
  };
}

/** TaxRate ids of a whole invoice (`total_taxes`). */
export function totalTaxRateIds(invoice: Stripe.Invoice): string[] {
  return (invoice.total_taxes ?? [])
    .map((tax) => tax.tax_rate_details?.tax_rate)
    .filter((id): id is string => typeof id === 'string');
}

/** HT / TVA / TTC of one invoice, for an email. Euros as `"10.00"`, read from Stripe, never recomputed. */
export type InvoiceTotals = {
  subtotal: string;
  tax_amount: string;
  /** One percent ("21.00"), or `null` (no TVA, or mixed rates). */
  tax_rate: string | null;
  reverse_charge: boolean;
  total: string;
};

const euros = (cents: number) => (cents / 100).toFixed(2);

export function invoiceTotals(
  invoice: Stripe.Invoice,
  infos: Map<string, TaxRateInfo>,
): InvoiceTotals {
  const tax = (invoice.total_taxes ?? []).reduce((s, t) => s + t.amount, 0);
  const label = taxLabel(totalTaxRateIds(invoice), infos);
  return {
    subtotal: euros(invoice.total_excluding_tax ?? invoice.total - tax),
    tax_amount: euros(tax),
    tax_rate: label.rate,
    reverse_charge: label.reverseCharge,
    total: euros(invoice.total),
  };
}
