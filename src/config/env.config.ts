import 'dotenv/config';
import * as Joi from 'joi';

export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  CORS_ORIGINS: string;
  SWAGGER_ENABLED: boolean;
  PRISMA_LOG?: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
  RESEND_API_KEY: string;
  EMAIL: string;
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
  EMAIL: Joi.string().email().required(), // sender address (domain verified in Resend)
}).unknown(true);

export function validateEnv(raw: Record<string, unknown>): Env {
  const result: Joi.ValidationResult<Env> = envSchema.validate(raw, {
    abortEarly: false,
  });
  if (result.error) {
    const details = result.error.details.map((d) => d.message).join('\n- ');
    throw new Error(`Invalid environment variables:\n- ${details}`);
  }
  return result.value;
}

/** Validated env, ready to use anywhere (config files, main.ts). */
export const env: Env = validateEnv(process.env);

export const ALLOWED_ORIGINS: string[] = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
