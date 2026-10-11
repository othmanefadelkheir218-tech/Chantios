import { Invoice, Prisma } from '@prisma/client';
import {
  LetterheadClient,
  LetterheadTenant,
} from '../layouts/letterhead.layout';
import { buildInvoiceDocDefinition } from './invoice.renderer';

// Step 18 — bank details in the invoice payment block.

const tenant = (over: Partial<LetterheadTenant> = {}): LetterheadTenant => ({
  name: 'Alpha',
  legalName: null,
  vatNumber: null,
  registrationNumber: null,
  email: 'boss@alpha.be',
  phone: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  country: null,
  currency: 'EUR',
  locale: 'fr',
  logoUrl: null,
  iban: null,
  bic: null,
  ...over,
});

const client = { name: 'Client' } as unknown as LetterheadClient;

const invoice = {
  number: 'F-2026-0001',
  issueDate: new Date('2026-10-01'),
  dueDate: new Date('2026-10-31'),
  note: null,
  amountExclVat: new Prisma.Decimal('100'),
  vatAmount: new Prisma.Decimal('21'),
  amountInclVat: new Prisma.Decimal('121'),
} as unknown as Invoice;

/** All the text of the PDF definition, flattened, to search in. */
function pdfText(t: LetterheadTenant): string {
  return JSON.stringify(
    buildInvoiceDocDefinition(invoice, [], t, client, null).content,
  );
}

describe('invoice PDF payment block — step 18', () => {
  it('prints the IBAN (in groups of 4) and the BIC when set', () => {
    const text = pdfText(tenant({ iban: 'BE68539007547034', bic: 'GKCCBEBB' }));
    expect(text).toContain('IBAN: BE68 5390 0754 7034');
    expect(text).toContain('BIC: GKCCBEBB');
    expect(text).toContain('Échéance: 2026-10-31');
  });

  it('shows the due date only without bank details', () => {
    const text = pdfText(tenant());
    expect(text).not.toContain('IBAN');
    expect(text).not.toContain('BIC');
    expect(text).toContain('Échéance: 2026-10-31');
  });
});

describe('invoice PDF language — the company locale', () => {
  it('fr: French labels', () => {
    const text = pdfText(tenant({ locale: 'fr', vatNumber: 'BE0123' }));
    expect(text).toContain('FACTURE');
    expect(text).toContain('Facturé à');
    expect(text).toContain('Total TVAC');
    expect(text).toContain('TVA BE0123');
    expect(text).not.toContain('Due date');
  });

  it('nl: Dutch labels', () => {
    const text = pdfText(tenant({ locale: 'nl' }));
    expect(text).toContain('FACTUUR');
    expect(text).toContain('Vervaldatum: 2026-10-31');
    expect(text).toContain('Totaal incl. btw');
  });

  it('en: English labels', () => {
    const text = pdfText(tenant({ locale: 'en' }));
    expect(text).toContain('INVOICE');
    expect(text).toContain('Due date: 2026-10-31');
    expect(text).toContain('Total incl. VAT');
  });

  it('an unknown locale falls back to French', () => {
    const text = pdfText(tenant({ locale: 'de' }));
    expect(text).toContain('FACTURE');
  });
});
