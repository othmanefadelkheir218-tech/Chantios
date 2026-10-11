import { Prisma } from '@prisma/client';
import type { Content, TableCell } from 'pdfmake';
import {
  computeVatBreakdown,
  DocumentTotals,
  VatLine,
} from '../../helpers/document-totals.helper';
import { PdfLabels } from './pdf-labels';

/** The line shape both `QuoteLine` and `InvoiceLine` satisfy — the only fields this layout prints. */
export interface DocumentLineLike extends VatLine {
  description: string;
  unit: string | null;
  quantity: Prisma.Decimal.Value;
  unitPriceExclVat: Prisma.Decimal.Value;
}

function money(value: Prisma.Decimal.Value, currency: string): string {
  return `${new Prisma.Decimal(value).toFixed(2)} ${currency}`;
}

/**
 * The lines table: description, unit, quantity, unit price, VAT %, line
 * total. No arithmetic here — `quantity`/`unit_price_excl_vat`/`total_excl_vat`
 * are printed exactly as stored (doc/notes/Phaces/15-documents.md: "the PDF
 * must never do its own arithmetic").
 */
export function buildLinesTable(
  lines: DocumentLineLike[],
  currency: string,
  labels: PdfLabels,
): Content {
  const header: TableCell[] = [
    { text: labels.description, style: 'tableHeader' },
    { text: labels.unit, style: 'tableHeader' },
    { text: labels.quantity, style: 'tableHeader', alignment: 'right' },
    { text: labels.unitPrice, style: 'tableHeader', alignment: 'right' },
    { text: labels.vatPercent, style: 'tableHeader', alignment: 'right' },
    { text: labels.lineTotal, style: 'tableHeader', alignment: 'right' },
  ];

  const rows: TableCell[][] = lines.map((line) => [
    { text: line.description },
    { text: line.unit ?? '—' },
    { text: new Prisma.Decimal(line.quantity).toString(), alignment: 'right' },
    { text: money(line.unitPriceExclVat, currency), alignment: 'right' },
    {
      text: `${new Prisma.Decimal(line.vatRate).toString()}%`,
      alignment: 'right',
    },
    { text: money(line.totalExclVat, currency), alignment: 'right' },
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
      body: [header, ...rows],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 10, 0, 0],
  };
}

/**
 * The per-rate VAT block (e.g. two rows for 6% and 21%) plus the three
 * stored totals. The per-rate rows come from `computeVatBreakdown` — the
 * SAME grouping `document-totals.helper.ts` uses for the stored columns —
 * never a second grouping pass over the lines. The three totals themselves
 * are the already-stored `amount_excl_vat`/`vat_amount`/`amount_incl_vat`
 * passed in by the caller, not recomputed here.
 */
export function buildTotalsBlock(
  lines: VatLine[],
  totals: DocumentTotals,
  currency: string,
  labels: PdfLabels,
): Content {
  const breakdown = computeVatBreakdown(lines);

  const vatRows: TableCell[][] = breakdown.map((row) => [
    { text: `${row.rate}%`, alignment: 'left' },
    { text: money(row.baseExclVat, currency), alignment: 'right' },
    { text: money(row.vatAmount, currency), alignment: 'right' },
  ]);

  const vatHeader: TableCell[] = [
    { text: labels.vatRate, style: 'tableHeader' },
    { text: labels.baseExclVat, style: 'tableHeader', alignment: 'right' },
    { text: labels.vat, style: 'tableHeader', alignment: 'right' },
  ];

  const vatTable: Content =
    breakdown.length > 0
      ? {
          table: {
            widths: ['auto', '*', '*'],
            body: [vatHeader, ...vatRows],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 10, 0, 10],
        }
      : { text: '' };

  // No explicit `Content` annotation: `width` belongs to `Column`, the type
  // `columns` below actually expects (`Content & ColumnProperties`) — typing
  // this literal as plain `Content` would make `width` an excess property.
  const summaryRows: TableCell[][] = [
    [
      { text: labels.totalExclVat },
      { text: money(totals.amountExclVat, currency), alignment: 'right' },
    ],
    [
      { text: labels.totalVat },
      { text: money(totals.vatAmount, currency), alignment: 'right' },
    ],
    [
      { text: labels.totalInclVat, style: 'totalLabel' },
      {
        text: money(totals.amountInclVat, currency),
        style: 'totalLabel',
        alignment: 'right',
      },
    ],
  ];

  const summaryColumn = {
    width: 260,
    table: {
      widths: ['*', 'auto'],
      body: summaryRows,
    },
    layout: 'noBorders',
  };

  return {
    stack: [vatTable, { columns: [{ text: '' }, summaryColumn] }],
  };
}
