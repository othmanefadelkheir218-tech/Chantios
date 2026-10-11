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
import { PdfLabels, pdfLabels } from '../layouts/pdf-labels';
import { PdfDocDefinition } from '../pdf.service';
import { DOCUMENT_STYLES } from './document.styles';

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toISOString().slice(0, 10);
}

/** `BE68539007547034` → `BE68 5390 0754 7034`, the way an IBAN is read. */
function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * The payment block (invoice only): the company's IBAN + BIC when set,
 * `due_date`, and `invoices.note` (payment terms, free text)
 * (doc/notes/Phaces/15-documents.md, doc/notes/entity-fields.md § tenants).
 */
function buildPaymentBlock(
  invoice: Invoice,
  tenant: LetterheadTenant,
  labels: PdfLabels,
): Content {
  return {
    stack: [
      { text: labels.payment, style: 'sectionLabel' },
      ...(tenant.iban ? [{ text: `IBAN: ${formatIban(tenant.iban)}` }] : []),
      ...(tenant.bic ? [{ text: `BIC: ${tenant.bic}` }] : []),
      { text: `${labels.dueDate}: ${formatDate(invoice.dueDate)}` },
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
  const labels = pdfLabels(tenant.locale);
  const totals: DocumentTotals = {
    amountExclVat: invoice.amountExclVat.toFixed(2),
    vatAmount: invoice.vatAmount.toFixed(2),
    amountInclVat: invoice.amountInclVat.toFixed(2),
  };

  return {
    pageMargins: [40, 40, 40, 60],
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    styles: DOCUMENT_STYLES,
    footer: () => buildFooter(tenant, labels),
    content: [
      buildLetterheadHeader(tenant, logoDataUri, labels),
      {
        columns: [
          { text: labels.invoiceTitle, style: 'documentTitle' },
          {
            text: [
              `${labels.number} ${invoice.number}\n`,
              `${labels.issueDate}: ${formatDate(invoice.issueDate)}\n`,
              `${labels.dueDate}: ${formatDate(invoice.dueDate)}`,
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 20, 0, 0],
      },
      buildClientBlock(client, labels),
      buildLinesTable(lines, tenant.currency, labels),
      buildTotalsBlock(lines, totals, tenant.currency, labels),
      buildPaymentBlock(invoice, tenant, labels),
    ],
  };
}
