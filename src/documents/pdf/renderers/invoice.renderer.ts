import { Invoice, InvoiceLine } from '@prisma/client';
import type { Content } from 'pdfmake';
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
 * The payment block (invoice only). `tenant bank details + due_date` was the
 * step file's wording, but `tenants` has no IBAN/bank-name/bank-account
 * column anywhere in the schema (open question 11, doc/notes/A_progress-tracker.md
 * and doc/Schema Proposal.md) — resolved before this build started: print
 * `due_date` and `invoices.note` (payment terms, free text) only, no bank
 * details line.
 */
function buildPaymentBlock(invoice: Invoice): Content {
  return {
    stack: [
      { text: 'Payment', style: 'sectionLabel' },
      { text: `Due date: ${formatDate(invoice.dueDate)}` },
      ...(invoice.note ? [{ text: invoice.note }] : []),
    ],
    margin: [0, 20, 0, 0],
  };
}

/**
 * The invoice's `TDocumentDefinitions` — same two shared layouts as the
 * quote, plus the payment block (doc/notes/Phaces/15-documents.md).
 */
export function buildInvoiceDocDefinition(
  invoice: Invoice,
  lines: InvoiceLine[],
  tenant: LetterheadTenant,
  client: LetterheadClient,
  logoDataUri: string | null,
): PdfDocDefinition {
  const totals: DocumentTotals = {
    amountExclVat: invoice.amountExclVat.toFixed(2),
    vatAmount: invoice.vatAmount.toFixed(2),
    amountInclVat: invoice.amountInclVat.toFixed(2),
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
          { text: 'INVOICE', style: 'documentTitle' },
          {
            text: [
              `No. ${invoice.number}\n`,
              `Issue date: ${formatDate(invoice.issueDate)}\n`,
              `Due date: ${formatDate(invoice.dueDate)}`,
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 20, 0, 0],
      },
      buildClientBlock(client),
      buildLinesTable(lines, tenant.currency),
      buildTotalsBlock(lines, totals, tenant.currency),
      buildPaymentBlock(invoice),
    ],
  };
}
