import { asIdOrNull, redactSecrets } from './audit.helper';

describe('redactSecrets', () => {
  it('hides secret-looking keys at every depth', () => {
    expect(
      redactSecrets({
        email: 'a@b.test',
        password: 'hunter2-hunter2',
        nested: { token_hash: 'abc', list: [{ pin: '1234', name: 'x' }] },
      }),
    ).toEqual({
      email: 'a@b.test',
      password: '[redacted]',
      nested: {
        token_hash: '[redacted]',
        list: [{ pin: '[redacted]', name: 'x' }],
      },
    });
  });

  it('does not hide ordinary fields that only contain "code" or "pin"', () => {
    expect(
      redactSecrets({ postal_code: '1000', shipping: 'x', mobile_pin: '1234' }),
    ).toEqual({
      postal_code: '1000',
      shipping: 'x',
      mobile_pin: '[redacted]',
    });
  });

  it('leaves dates and plain values alone', () => {
    const date = new Date();
    expect(redactSecrets({ at: date })).toEqual({ at: date });
    expect(redactSecrets('text')).toBe('text');
  });
});

describe('asIdOrNull', () => {
  it('keeps a positive integer, already a number', () => {
    expect(asIdOrNull(42)).toBe(42);
  });

  it('parses a numeric string, as route params arrive before ParseIntPipe', () => {
    expect(asIdOrNull('42')).toBe(42);
  });

  it('drops zero and negative numbers', () => {
    expect(asIdOrNull(0)).toBeNull();
    expect(asIdOrNull(-5)).toBeNull();
    expect(asIdOrNull('-5')).toBeNull();
  });

  it('drops a non-integer number', () => {
    expect(asIdOrNull(1.5)).toBeNull();
    expect(asIdOrNull('1.5')).toBeNull();
  });

  it('drops anything that is not a valid integer', () => {
    expect(asIdOrNull('abc')).toBeNull();
    expect(asIdOrNull(undefined)).toBeNull();
    expect(asIdOrNull(null)).toBeNull();
  });
});
