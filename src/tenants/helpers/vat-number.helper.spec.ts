import {
  isEuVatNumber,
  isValidVatNumberFormat,
  normalizeVatNumber,
} from './vat-number.helper';

describe('vat-number helper (step 27)', () => {
  it.each([
    ['be 0123.456.789', 'BE0123456789'],
    ['FR-12 345678901', 'FR12345678901'],
    ['', null],
    [null, null],
    ['  ', null],
  ])('normalizes %p → %p', (raw, expected) => {
    expect(normalizeVatNumber(raw)).toBe(expected);
  });

  it.each([
    'BE0123456789',
    'BE1234567890',
    'FR12345678901',
    'FRAB345678901',
    'NL123456789B01',
    'DE123456789',
    'ESA1234567B',
    'ATU12345678',
    'CHE123456789',
  ])('accepts %s', (number) => {
    expect(isValidVatNumberFormat(number)).toBe(true);
  });

  it.each([
    'BE2123456789', // BE starts with 0 or 1
    'BE012345678', // too short
    'NL123456789',
    'DE12345678',
    '0123456789', // no country prefix
    'B',
    'HELLO', // letters only: not a number
    'XXABC1', // one digit only
  ])('refuses %s', (number) => {
    expect(isValidVatNumberFormat(number)).toBe(false);
  });

  it('knows which numbers VIES can check', () => {
    expect(isEuVatNumber('BE0123456789')).toBe(true);
    expect(isEuVatNumber('ELA123')).toBe(true);
    expect(isEuVatNumber('CHE123456789')).toBe(false);
  });
});
