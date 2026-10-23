// env.config.ts validates process.env when imported, so we give it valid values first.
const valid = {
  DATABASE_URL: 'postgresql://u:p@127.0.0.1:5440/db',
  REDIS_URL: 'redis://127.0.0.1:6390',
  STRIPE_SECRET_KEY: 'sk_test_abc',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_abc',
  STRIPE_WEBHOOK_SECRET: 'whsec_abc',
  IMAGEKIT_PUBLIC_KEY: 'public_abc',
  IMAGEKIT_PRIVATE_KEY: 'private_abc',
  IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/abc',
  RESEND_API_KEY: 're_abc',
  EMAIL: 'no-reply@example.com',
  APP_URL: 'http://localhost:5300',
  PORTAL_BASE_URL: 'http://localhost:3000/portal',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  EMAIL_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  INBOUND_EMAIL_DOMAIN: 'mail.example.com',
};
Object.assign(process.env, valid);

import { validateEnv } from './env.config';

describe('validateEnv (Stripe + ImageKit + Resend)', () => {
  it('accepts valid values', () => {
    expect(() => validateEnv(valid)).not.toThrow();
  });

  it.each(
    Object.keys(valid).filter((k) => /STRIPE|IMAGEKIT|RESEND|EMAIL/.test(k)),
  )('requires %s', (key) => {
    const env: Record<string, string> = { ...valid };
    delete env[key];
    expect(() => validateEnv(env)).toThrow(key);
  });

  it.each([
    ['STRIPE_SECRET_KEY', 'pk_test_abc'],
    ['STRIPE_PUBLISHABLE_KEY', 'sk_test_abc'],
    ['STRIPE_WEBHOOK_SECRET', 'sk_test_abc'],
    ['IMAGEKIT_URL_ENDPOINT', 'not-a-url'],
    ['RESEND_API_KEY', 'sk_test_abc'],
    ['EMAIL', 'not-an-email'],
  ])('rejects a wrong format for %s', (key, value) => {
    expect(() => validateEnv({ ...valid, [key]: value })).toThrow(key);
  });
});

describe('validateEnv (production must not use localhost links)', () => {
  const prod = {
    ...valid,
    RESEND_WEBHOOK_SECRET: 'whsec_abc',
    GOOGLE_CLIENT_ID: 'id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'secret',
    NODE_ENV: 'production',
    APP_URL: 'https://app.chantieros.com',
    PORTAL_BASE_URL: 'https://app.chantieros.com/portal',
  };

  it('accepts real public URLs in production', () => {
    expect(() => validateEnv(prod)).not.toThrow();
  });

  it.each([
    ['APP_URL', 'http://localhost:5300/i'],
    ['APP_URL', 'http://127.0.0.1:3000'],
    ['PORTAL_BASE_URL', 'http://localhost:3000/portal'],
  ])('rejects %s = %s in production', (key, url) => {
    expect(() => validateEnv({ ...prod, [key]: url })).toThrow(
      `${key} must not point to localhost`,
    );
  });

  it('lists every localhost variable at once', () => {
    expect(() =>
      validateEnv({
        ...prod,
        APP_URL: 'http://localhost:5300/i',
        PORTAL_BASE_URL: 'http://localhost:3000/portal',
      }),
    ).toThrow('APP_URL, PORTAL_BASE_URL must not point to localhost');
  });

  it('allows localhost in development and test', () => {
    for (const NODE_ENV of ['development', 'test']) {
      expect(() =>
        validateEnv({ ...valid, NODE_ENV, APP_URL: 'http://localhost:5300/i' }),
      ).not.toThrow();
    }
  });
});

describe('validateEnv COOKIE_DOMAIN (step 18)', () => {
  it.each(['', '.example.com', 'app.example.com'])('accepts "%s"', (value) => {
    expect(() => validateEnv({ ...valid, COOKIE_DOMAIN: value })).not.toThrow();
  });

  it.each(['localhost', 'https://example.com', 'exa mple.com'])(
    'refuses "%s"',
    (value) => {
      expect(() => validateEnv({ ...valid, COOKIE_DOMAIN: value })).toThrow(
        'COOKIE_DOMAIN',
      );
    },
  );
});

describe('validateEnv client email (step 25)', () => {
  it('refuses a key that is not 32 bytes', () => {
    expect(() =>
      validateEnv({
        ...valid,
        EMAIL_TOKEN_ENCRYPTION_KEY: Buffer.alloc(16).toString('base64'),
      }),
    ).toThrow('EMAIL_TOKEN_ENCRYPTION_KEY must be 32 bytes');
  });

  it('needs the Google and Resend secrets in production only', () => {
    const prod = {
      ...valid,
      NODE_ENV: 'production',
      APP_URL: 'https://app.chantieros.com',
      PORTAL_BASE_URL: 'https://app.chantieros.com/portal',
    };
    expect(() => validateEnv(prod)).toThrow(
      'RESEND_WEBHOOK_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET must be set',
    );
    expect(() => validateEnv(valid)).not.toThrow();
  });
});

describe('validateEnv TVA on the subscription (step 27)', () => {
  it('defaults to a Belgian seller and the VIES check', () => {
    const value = validateEnv(valid);
    expect(value.SELLER_COUNTRY).toBe('BE');
    expect(value.VAT_NUMBER_CHECK).toBe('vies');
  });

  it('accepts VAT_NUMBER_CHECK=off (its own switch, not NODE_ENV)', () => {
    expect(
      validateEnv({ ...valid, VAT_NUMBER_CHECK: 'off' }).VAT_NUMBER_CHECK,
    ).toBe('off');
  });

  it.each(['be', 'BEL', 'B1', ''])('refuses SELLER_COUNTRY "%s"', (value) => {
    expect(() => validateEnv({ ...valid, SELLER_COUNTRY: value })).toThrow(
      'SELLER_COUNTRY',
    );
  });

  it('refuses an unknown VAT_NUMBER_CHECK', () => {
    expect(() => validateEnv({ ...valid, VAT_NUMBER_CHECK: 'yes' })).toThrow(
      'VAT_NUMBER_CHECK',
    );
  });
});
