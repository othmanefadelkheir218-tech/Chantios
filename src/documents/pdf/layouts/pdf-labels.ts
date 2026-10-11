/**
 * Every fixed word printed on a quote / invoice PDF, per language. The PDF
 * uses the COMPANY's language (`tenants.locale`), never the client's;
 * French when the locale is unknown (doc/notes/client-invoices.md § PDF
 * language). Same idea as the email templates: one copy table, no
 * translation library.
 */
export type PdfLocale = 'fr' | 'nl' | 'en';

export interface PdfLabels {
  quoteTitle: string;
  invoiceTitle: string;
  number: string;
  issueDate: string;
  dueDate: string;
  validUntil: string;
  billedTo: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  vatPercent: string;
  lineTotal: string;
  vatRate: string;
  baseExclVat: string;
  vat: string;
  totalExclVat: string;
  totalVat: string;
  totalInclVat: string;
  vatNumber: string;
  registrationNumber: string;
  payment: string;
  terms: string;
}

const LABELS: Record<PdfLocale, PdfLabels> = {
  fr: {
    quoteTitle: 'DEVIS',
    invoiceTitle: 'FACTURE',
    number: 'N°',
    issueDate: 'Date',
    dueDate: 'Échéance',
    validUntil: 'Valable jusqu’au',
    billedTo: 'Facturé à',
    description: 'Description',
    unit: 'Unité',
    quantity: 'Qté',
    unitPrice: 'Prix unitaire',
    vatPercent: 'TVA %',
    lineTotal: 'Total HTVA',
    vatRate: 'Taux TVA',
    baseExclVat: 'Base HTVA',
    vat: 'TVA',
    totalExclVat: 'Total HTVA',
    totalVat: 'Total TVA',
    totalInclVat: 'Total TVAC',
    vatNumber: 'TVA',
    registrationNumber: 'N° d’entreprise',
    payment: 'Paiement',
    terms: 'Conditions',
  },
  nl: {
    quoteTitle: 'OFFERTE',
    invoiceTitle: 'FACTUUR',
    number: 'Nr.',
    issueDate: 'Datum',
    dueDate: 'Vervaldatum',
    validUntil: 'Geldig tot',
    billedTo: 'Gefactureerd aan',
    description: 'Omschrijving',
    unit: 'Eenheid',
    quantity: 'Aantal',
    unitPrice: 'Eenheidsprijs',
    vatPercent: 'Btw %',
    lineTotal: 'Totaal excl. btw',
    vatRate: 'Btw-tarief',
    baseExclVat: 'Basis excl. btw',
    vat: 'Btw',
    totalExclVat: 'Totaal excl. btw',
    totalVat: 'Totaal btw',
    totalInclVat: 'Totaal incl. btw',
    vatNumber: 'Btw',
    registrationNumber: 'Ondernemingsnr.',
    payment: 'Betaling',
    terms: 'Voorwaarden',
  },
  en: {
    quoteTitle: 'QUOTE',
    invoiceTitle: 'INVOICE',
    number: 'No.',
    issueDate: 'Issue date',
    dueDate: 'Due date',
    validUntil: 'Valid until',
    billedTo: 'Billed to',
    description: 'Description',
    unit: 'Unit',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    vatPercent: 'VAT %',
    lineTotal: 'Total excl. VAT',
    vatRate: 'VAT rate',
    baseExclVat: 'Base excl. VAT',
    vat: 'VAT',
    totalExclVat: 'Total excl. VAT',
    totalVat: 'Total VAT',
    totalInclVat: 'Total incl. VAT',
    vatNumber: 'VAT',
    registrationNumber: 'Reg.',
    payment: 'Payment',
    terms: 'Terms & conditions',
  },
};

/** The labels for a company locale; French for anything unknown. */
export function pdfLabels(locale: string | null | undefined): PdfLabels {
  return LABELS[locale as PdfLocale] ?? LABELS.fr;
}
