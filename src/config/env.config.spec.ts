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
