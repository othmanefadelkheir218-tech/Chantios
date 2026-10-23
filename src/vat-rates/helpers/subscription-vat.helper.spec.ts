import { VatNumberStatus } from '@prisma/client';
import {
  resolveSubscriptionVat,
  VatCompany,
  VatRow,
} from './subscription-vat.helper';

const row = (over: Partial<VatRow> = {}): VatRow => ({
  rate: '20.00',
  isEu: true,
  isActive: true,
  stripeTaxRateId: 'txr_normal',
  stripeReverseChargeTaxRateId: 'txr_reverse',
  ...over,
});

const company = (
  country: string | null,
  vatNumber: string | null = null,
  vatNumberStatus: VatNumberStatus | null = null,
): VatCompany => ({ country, vatNumber, vatNumberStatus });

describe('resolveSubscriptionVat (step 27 § 3)', () => {
  it.each([null, '', '  '])('no country (%p) → missing no_country', (c) => {
    expect(resolveSubscriptionVat(company(c), 'BE', row())).toEqual({
      kind: 'missing',
      reason: 'no_country',
    });
  });

  it('no row for the country → missing country_not_supported', () => {
    expect(resolveSubscriptionVat(company('US'), 'BE', null)).toEqual({
      kind: 'missing',
      reason: 'country_not_supported',
    });
  });

  it('a closed country → missing country_not_supported', () => {
    expect(
      resolveSubscriptionVat(company('FR'), 'BE', row({ isActive: false })),
    ).toEqual({ kind: 'missing', reason: 'country_not_supported' });
  });

  it.each<[string | null, VatNumberStatus | null]>([
    [null, null],
    ['BE0123456789', 'valid'],
    ['BE0123456789', 'not_checked'],
    ['BE0123456789', 'invalid'],
  ])(
    'seller country → domestic rate, TVA number %p (%p) does not matter',
    (number, status) => {
      expect(
        resolveSubscriptionVat(
          company('BE', number, status),
          'BE',
          row({ rate: '21.00' }),
        ),
      ).toEqual({
        kind: 'domestic',
        country: 'BE',
        rate: '21.00',
        stripeTaxRateId: 'txr_normal',
      });
    },
  );

  it('lower-case country still matches the seller', () => {
    expect(resolveSubscriptionVat(company('be'), 'BE', row()).kind).toBe(
      'domestic',
    );
  });

  it.each<VatNumberStatus>(['valid', 'not_checked'])(
    'other EU country + TVA number %s → reverse charge 0 %%',
    (status) => {
      expect(
        resolveSubscriptionVat(
          company('FR', 'FR12345678901', status),
          'BE',
          row(),
        ),
      ).toEqual({
        kind: 'reverse_charge',
        country: 'FR',
        rate: '0.00',
        stripeTaxRateId: 'txr_reverse',
      });
    },
  );

  it.each<VatNumberStatus | null>(['invalid', 'pending', null])(
    'other EU country + TVA number with status %p → country rate',
    (status) => {
      expect(
        resolveSubscriptionVat(
          company('FR', 'FR12345678901', status),
          'BE',
          row(),
        ),
      ).toEqual({
        kind: 'country_rate',
        country: 'FR',
        rate: '20.00',
        stripeTaxRateId: 'txr_normal',
      });
    },
  );

  it('VIES on: a not_checked number (from test mode) no longer gives 0 %', () => {
    expect(
      resolveSubscriptionVat(
        company('FR', 'FR12345678901', 'not_checked'),
        'BE',
        row(),
        false,
      ).kind,
    ).toBe('country_rate');
  });

  it('VIES on: a valid number still gives 0 %', () => {
    expect(
      resolveSubscriptionVat(
        company('FR', 'FR12345678901', 'valid'),
        'BE',
        row(),
        false,
      ).kind,
    ).toBe('reverse_charge');
  });

  it('other EU country without a TVA number → country rate', () => {
    expect(resolveSubscriptionVat(company('FR'), 'BE', row()).kind).toBe(
      'country_rate',
    );
  });

  it('an empty TVA number with a stale status → country rate', () => {
    expect(
      resolveSubscriptionVat(company('FR', ' ', 'valid'), 'BE', row()).kind,
    ).toBe('country_rate');
  });

  it('non-EU country, even with a valid TVA number → country rate', () => {
    expect(
      resolveSubscriptionVat(
        company('CH', 'CHE123456789', 'valid'),
        'BE',
        row({ isEu: false, rate: '8.10', stripeReverseChargeTaxRateId: null }),
      ),
    ).toEqual({
      kind: 'country_rate',
      country: 'CH',
      rate: '8.10',
      stripeTaxRateId: 'txr_normal',
    });
  });
});
