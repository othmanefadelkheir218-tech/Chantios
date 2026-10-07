import { Quote, QuoteLine } from '@prisma/client';
import { DocumentTotals } from '../../helpers/document-totals.helper';
import { buildLinesTable, buildTotalsBlock } from '../layouts/document.layout';
import {
  buildClientBlock,
  buildFooter,
  buildLetterheadHeader,
  LetterheadClient,
  LetterheadTenant,
} from '../layouts/letterhead.layout';
import { PdfDocDefinition } from '../pdf.service';
import { DOCUMENT_STYLES } from './document.styles';

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toISOString().slice(0, 10);
}

/**
 * The quote's `TDocumentDefinitions` — title, number prefix and the absence
 * of a payment block are the only things that differ from an invoice; both
 * renderers call the same two shared layouts (doc/notes/Phaces/15-documents.md:
 * "One shared layout. A quote and an invoice differ only in the title, the
 * number prefix and the payment block").
 */
export function buildQuoteDocDefinition(
  quote: Quote,
  lines: QuoteLine[],
  tenant: LetterheadTenant,
  client: LetterheadClient,
  logoDataUri: string | null,
): PdfDocDefinition {
  const totals: DocumentTotals = {
    amountExclVat: quote.amountExclVat.toFixed(2),
    vatAmount: quote.vatAmount.toFixed(2),
    amountInclVat: quote.amountInclVat.toFixed(2),
  };

  return {
    pageMargins: [40, 40, 40, 60],
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    styles: DOCUMENT_STYLES,
    footer: () => buildFooter(tenant),
    content: [
      buildLetterheadHeader(tenant, logoDataUri),
      {
        columns: [
          { text: 'QUOTE', style: 'documentTitle' },
          {
            text: [
              `No. ${quote.number}\n`,
              `Issue date: ${formatDate(quote.issueDate)}\n`,
              `Valid until: ${formatDate(quote.validUntil)}`,
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 20, 0, 0],
      },
      buildClientBlock(client),
      buildLinesTable(lines, tenant.currency),
      buildTotalsBlock(lines, totals, tenant.currency),
      ...(quote.note
        ? [
            {
              stack: [
                { text: 'Terms & conditions', style: 'sectionLabel' },
                { text: quote.note },
              ],
              margin: [0, 20, 0, 0] as [number, number, number, number],
            },
          ]
        : []),
    ],
  };
}
