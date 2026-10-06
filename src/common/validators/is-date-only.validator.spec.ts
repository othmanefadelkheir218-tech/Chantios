import { isValidDateOnly } from './is-date-only.validator';

describe('isValidDateOnly', () => {
  it('accepts a real calendar date', () => {
    expect(isValidDateOnly('2026-11-03')).toBe(true);
    expect(isValidDateOnly('2028-02-29')).toBe(true); // leap year
  });

  it('refuses a date that has the shape but does not exist', () => {
    expect(isValidDateOnly('2026-13-45')).toBe(false);
    expect(isValidDateOnly('2026-02-30')).toBe(false);
    expect(isValidDateOnly('2027-02-29')).toBe(false); // not a leap year
    expect(isValidDateOnly('2026-00-10')).toBe(false);
  });

  it('refuses a time part, other shapes and non-strings', () => {
    expect(isValidDateOnly('2026-11-03T10:00:00Z')).toBe(false);
    expect(isValidDateOnly('03/11/2026')).toBe(false);
    expect(isValidDateOnly('')).toBe(false);
    expect(isValidDateOnly(20261103)).toBe(false);
    expect(isValidDateOnly(null)).toBe(false);
    expect(isValidDateOnly(undefined)).toBe(false);
  });
});
