import { createHash, randomInt } from 'crypto';
import { OneTimeCodeType } from '@prisma/client';

/** doc/notes/auth-tokens.md § "Lifetime and limits per type". */
export const CODE_LIFETIME_MS: Record<OneTimeCodeType, number> = {
  password_reset: 60 * 60 * 1000,
  email_verification: 24 * 60 * 60 * 1000,
  admin_2fa: 5 * 60 * 1000,
};

/** Types absent here (`email_verification`) have no attempt limit. */
export const CODE_MAX_ATTEMPTS: Partial<Record<OneTimeCodeType, number>> = {
  password_reset: 5,
  admin_2fa: 3,
};

/** 6 digits, cryptographically random. */
export function generateCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
