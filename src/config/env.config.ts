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
  /** Signs the Resend inbound-email webhook. Optional while that route is a test. */
  RESEND_WEBHOOK_SECRET?: string;
  /** Google OAuth client for "Connect Gmail" (send only). Optional while that route is a test. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI: string;
  EMAIL: string;
  APP_URL: string;
  PORTAL_BASE_URL: string;
  COOKIE_DOMAIN?: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
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
    .default('http://localhost:5300/api/email-connections/google/callback'),
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
}).unknown(true);

/** Env variables holding a public link: never `localhost` in production. */
const PUBLIC_URL_KEYS = ['APP_URL', 'PORTAL_BASE_URL'] as const;
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
  if (value.NODE_ENV === 'production') {
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
