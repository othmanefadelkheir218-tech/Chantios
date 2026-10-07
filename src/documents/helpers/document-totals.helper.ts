import { Prisma } from '@prisma/client';

/**
 * One priced line, as needed by the VAT grouping — `quote_lines` and
 * `invoice_lines` both fit this shape. `totalExclVat` is read back from the
 * DB after insert (set by the `set_document_line_total` trigger), never
 * recomputed here — this helper only groups and rounds, it never multiplies
 * `quantity * unit_price_excl_vat` itself (doc/Schema Proposal.md § 6).
 */
export interface VatLine {
  totalExclVat: Prisma.Decimal.Value;
  vatRate: Prisma.Decimal.Value;
}

export interface DocumentTotals {
  amountExclVat: string;
  vatAmount: string;
  amountInclVat: string;
}

/** One row of the per-rate VAT breakdown a Belgian invoice/quote must print. */
export interface VatBreakdownRow {
  rate: string;
  baseExclVat: string;
  vatAmount: string;
}

/**
 * The shared grouping step both `computeDocumentTotals` and
 * `computeVatBreakdown` build on — SUM(total_excl_vat) per distinct
 * `vat_rate`, keyed by the rate's decimal string. Internal: callers outside
 * this file go through one of the two exported functions below, never this
 * one directly, so the rounding rule (once per rate group) stays in one
 * place.
 */
function groupExclVatByRate(lines: VatLine[]): Map<string, Prisma.Decimal> {
  const groups = new Map<string, Prisma.Decimal>();

  for (const line of lines) {
    const rateKey = new Prisma.Decimal(line.vatRate).toString();
    const current = groups.get(rateKey) ?? new Prisma.Decimal(0);
    groups.set(rateKey, current.plus(new Prisma.Decimal(line.totalExclVat)));
  }

  return groups;
}

/**
 * The one implementation of per-rate VAT grouping (doc/notes/Phaces/06-quotes-invoices.md):
 *
 *   for each distinct vat_rate on the lines:
 *     group_excl_vat = SUM(total_excl_vat) of the lines at that rate
 *     group_vat      = round(group_excl_vat * vat_rate / 100, 2)
 *   amount_excl_vat = SUM(group_excl_vat)
 *   vat_amount      = SUM(group_vat)
 *   amount_incl_vat = amount_excl_vat + vat_amount
 *
 * Rounded once per rate group, never per line then summed. `quotes` and
 * `invoices` both call this for their 3 stored totals — one implementation,
 * reused (step 15's PDF reads the per-rate breakdown back via
 * `computeVatBreakdown`, built on the same grouping, not a second way).
 */
export function computeDocumentTotals(lines: VatLine[]): DocumentTotals {
  const groups = groupExclVatByRate(lines);

  let amountExclVat = new Prisma.Decimal(0);
  let vatAmount = new Prisma.Decimal(0);

  for (const [rateKey, groupExclVat] of groups) {
    amountExclVat = amountExclVat.plus(groupExclVat);
    const groupVat = groupExclVat
      .times(new Prisma.Decimal(rateKey))
      .dividedBy(100)
      .toDecimalPlaces(2);
    vatAmount = vatAmount.plus(groupVat);
  }

  const amountInclVat = amountExclVat.plus(vatAmount);

  return {
    amountExclVat: amountExclVat.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    amountInclVat: amountInclVat.toFixed(2),
  };
}

/**
 * Step 15's PDF needs the per-rate rows themselves (base/rate/VAT for each
 * distinct `vat_rate`), not just the 3 summed totals `computeDocumentTotals`
 * returns. Built on the same `groupExclVatByRate` internals — never a second
 * grouping pass over the lines. Sorted by rate ascending so the printed
 * block is stable (e.g. 6% row before 21%).
 */
export function computeVatBreakdown(lines: VatLine[]): VatBreakdownRow[] {
  const groups = groupExclVatByRate(lines);

  const rows: VatBreakdownRow[] = [];
  for (const [rateKey, groupExclVat] of groups) {
    const groupVat = groupExclVat
      .times(new Prisma.Decimal(rateKey))
      .dividedBy(100)
      .toDecimalPlaces(2);
    rows.push({
      rate: rateKey,
      baseExclVat: groupExclVat.toFixed(2),
      vatAmount: groupVat.toFixed(2),
    });
  }

  return rows.sort((a, b) => Number(a.rate) - Number(b.rate));
}
