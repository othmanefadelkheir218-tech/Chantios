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
 * reused (step 15's PDF will read the same per-rate breakdown from the
 * frozen lines, not recompute it a third way).
 */
export function computeDocumentTotals(lines: VatLine[]): DocumentTotals {
  const groups = new Map<string, Prisma.Decimal>();

  for (const line of lines) {
    const rateKey = new Prisma.Decimal(line.vatRate).toString();
    const current = groups.get(rateKey) ?? new Prisma.Decimal(0);
    groups.set(rateKey, current.plus(new Prisma.Decimal(line.totalExclVat)));
  }

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
