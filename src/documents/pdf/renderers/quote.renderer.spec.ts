import { Prisma, Quote } from '@prisma/client';
import {
  LetterheadClient,
  LetterheadTenant,
} from '../layouts/letterhead.layout';
import { buildQuoteDocDefinition } from './quote.renderer';

const tenant = (locale: string) =>
  ({
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
    locale,
    logoUrl: null,
    iban: null,
    bic: null,
  }) satisfies LetterheadTenant;

const client = { name: 'Client' } as unknown as LetterheadClient;

const quote = {
  number: 'D-2026-0001',
  issueDate: new Date('2026-10-01'),
  validUntil: new Date('2026-10-31'),
  note: 'Paid in 2 parts',
  amountExclVat: new Prisma.Decimal('100'),
  vatAmount: new Prisma.Decimal('21'),
  amountInclVat: new Prisma.Decimal('121'),
} as unknown as Quote;

function pdfText(locale: string): string {
  return JSON.stringify(
    buildQuoteDocDefinition(quote, [], tenant(locale), client, null).content,
  );
}

describe('quote PDF language — the company locale', () => {
  it('fr', () => {
    const text = pdfText('fr');
    expect(text).toContain('DEVIS');
    expect(text).toContain('N° D-2026-0001');
    expect(text).toContain('Conditions');
    expect(text).toContain('Total HTVA');
  });

  it('nl', () => {
    const text = pdfText('nl');
    expect(text).toContain('OFFERTE');
    expect(text).toContain('Geldig tot: 2026-10-31');
    expect(text).toContain('Voorwaarden');
  });

  it('en', () => {
    const text = pdfText('en');
    expect(text).toContain('QUOTE');
    expect(text).toContain('Valid until: 2026-10-31');
    expect(text).toContain('Terms & conditions');
  });
});
