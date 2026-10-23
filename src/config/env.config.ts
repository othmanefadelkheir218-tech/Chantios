import 'dotenv/config';
import * as Joi from 'joi';

export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  CORS_ORIGINS: string;
  SWAGGER_ENABLED: boolean;
  /** Step 20 — the super-admin dev tools (time travel, run a job now). Never in production. */
  DEV_TOOLS: boolean;
  PRISMA_LOG?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
  RESEND_API_KEY: string;
  /** Signs the Resend inbound-email webhook. Required in production. */
  RESEND_WEBHOOK_SECRET?: string;
  /** Google OAuth client for "Connect Gmail" (send only). Required in production. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI: string;
  /** Step 25 — AES-256-GCM key for the Gmail refresh tokens: 32 bytes, base64. */
  EMAIL_TOKEN_ENCRYPTION_KEY: string;
  /** Step 25 — the domain we receive client emails on, e.g. `mail.zouadev.com`. */
  INBOUND_EMAIL_DOMAIN: string;
  EMAIL: string;
  APP_URL: string;
  PORTAL_BASE_URL: string;
  COOKIE_DOMAIN?: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  /** Step 27 — the country ChantierOS sells from (TVA on the subscription). ISO 2 letters, upper case. */
  SELLER_COUNTRY: string;
  /** Step 27 — `vies` checks a company's TVA number with the EU VIES service; `off` = format only (dev, test servers). */
  VAT_NUMBER_CHECK: 'vies' | 'off';
}

/** Every env variable used by the app. The app stops at startup if one is invalid. */
const envSchema = Joi.object<Env>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(5300),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  SWAGGER_ENABLED: Joi.boolean().default(true),
  DEV_TOOLS: Joi.boolean().default(false),
  PRISMA_LOG: Joi.string().valid('query').allow('').optional(),
  STRIPE_SECRET_KEY: Joi.string()
    .pattern(/^sk_(test|live)_/)
    .required(),
  STRIPE_PUBLISHABLE_KEY: Joi.string()
    .pattern(/^pk_(test|live)_/)
    .required(),
  STRIPE_WEBHOOK_SECRET: Joi.string()
    .pattern(/^whsec_/)
    .required(),
  IMAGEKIT_PUBLIC_KEY: Joi.string().required(),
  IMAGEKIT_PRIVATE_KEY: Joi.string().required(),
  IMAGEKIT_URL_ENDPOINT: Joi.string().uri().required(),
  RESEND_API_KEY: Joi.string().pattern(/^re_/).required(),
  RESEND_WEBHOOK_SECRET: Joi.string()
    .pattern(/^whsec_/)
    .allow('')
    .optional(),
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_REDIRECT_URI: Joi.string()
    .uri()
    .default('http://localhost:5300/api/email-inboxes/gmail/callback'),
  EMAIL_TOKEN_ENCRYPTION_KEY: Joi.string().base64().required(),
  INBOUND_EMAIL_DOMAIN: Joi.string().hostname().required(),
  EMAIL: Joi.string().email().required(), // sender address (domain verified in Resend)
  APP_URL: Joi.string().uri().required(), // base URL of the frontend pages that the invitation links open
  PORTAL_BASE_URL: Joi.string().uri().required(), // step 12 — client portal
  // Step 18 — production only: the parent domain shared by the frontend and the API (e.g. `.example.com`)
  COOKIE_DOMAIN: Joi.string()
    .pattern(/^\.?[a-z0-9-]+(\.[a-z0-9-]+)+$/i)
    .allow('')
    .optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  SELLER_COUNTRY: Joi.string()
    .pattern(/^[A-Z]{2}$/)
    .default('BE'),
  // Its own switch, not tied to NODE_ENV: a hosted test server can turn it off.
  VAT_NUMBER_CHECK: Joi.string().valid('vies', 'off').default('vies'),
}).unknown(true);

/** Env variables holding a public link: never `localhost` in production. */
const PUBLIC_URL_KEYS = ['APP_URL', 'PORTAL_BASE_URL'] as const;
/** Step 25 — optional in dev, the email feature needs them in production. */
const PRODUCTION_REQUIRED_KEYS = [
  'RESEND_WEBHOOK_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];

function isLocalUrl(value: string): boolean {
  return LOCAL_HOSTS.includes(new URL(value).hostname);
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const result: Joi.ValidationResult<Env> = envSchema.validate(raw, {
    abortEarly: false,
  });
  if (result.error) {
    const details = result.error.details.map((d) => d.message).join('\n- ');
    throw new Error(`Invalid environment variables:\n- ${details}`);
  }
  const value = result.value;
  if (Buffer.from(value.EMAIL_TOKEN_ENCRYPTION_KEY, 'base64').length !== 32) {
    throw new Error(
      `Invalid environment variables:
- EMAIL_TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 (openssl rand -base64 32)`,
    );
  }
  if (value.NODE_ENV === 'production') {
    const missing = PRODUCTION_REQUIRED_KEYS.filter((key) => !value[key]);
    if (missing.length > 0) {
      throw new Error(
        `Invalid environment variables:
- ${missing.join(', ')} must be set when NODE_ENV is production`,
      );
    }
    const local = PUBLIC_URL_KEYS.filter((key) => isLocalUrl(value[key]));
    if (local.length > 0) {
      throw new Error(
        `Invalid environment variables:
- ${local.join(', ')} must not point to localhost when NODE_ENV is production`,
      );
    }
    if (value.DEV_TOOLS) {
      throw new Error(
        `Invalid environment variables:
- DEV_TOOLS must be false when NODE_ENV is production`,
      );
    }
  }
  return value;
}

/** Validated env, ready to use anywhere (config files, main.ts). */
export const env: Env = validateEnv(process.env);

/** The dev tools answer only outside production AND with `DEV_TOOLS=true`. */
export const DEV_TOOLS_ENABLED: boolean =
  env.DEV_TOOLS && env.NODE_ENV !== 'production';

export const ALLOWED_ORIGINS: string[] = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
