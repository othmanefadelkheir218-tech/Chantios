import { asUuidOrNull, redactSecrets } from './audit.helper';

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

describe('asUuidOrNull', () => {
  it('keeps a uuid and drops anything else', () => {
    expect(asUuidOrNull('3f8a1c52-9d2e-4b7a-8f61-2c5e7a9b0d14')).toBe(
      '3f8a1c52-9d2e-4b7a-8f61-2c5e7a9b0d14',
    );
    expect(asUuidOrNull('not-a-uuid')).toBeNull();
    expect(asUuidOrNull(undefined)).toBeNull();
  });
});
