import type { Style } from 'pdfmake';

/** Shared `TDocumentDefinitions.styles` for both `quote.renderer.ts` and `invoice.renderer.ts`. */
export const DOCUMENT_STYLES: Record<string, Style> = {
  companyName: { fontSize: 16, bold: true },
  tenantBlock: { fontSize: 8, color: '#444444', lineHeight: 1.3 },
  documentTitle: { fontSize: 20, bold: true },
  sectionLabel: { fontSize: 8, bold: true, color: '#666666' },
  tableHeader: { bold: true, fillColor: '#f2f2f2' },
  totalLabel: { bold: true, fontSize: 11 },
  footer: { fontSize: 7, color: '#888888' },
};
