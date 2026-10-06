import { InvoiceStatus, QuoteStatus } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.config';

/**
 * The ONE answer to every failed token check — a random string, an inactive
 * link, an expired one. Never says which check failed.
 */
export const PORTAL_EXPIRED_MESSAGE =
  'This link has expired. Please contact your company.';

/** A new link lasts this long unless the staff member asks for another. Held in the `expires_at` COLUMN, never a constant at read time. */
export const DEFAULT_EXPIRY_DAYS = 90;

/** What the client may see (doc/notes/Phaces/12-client-portal.md § "What the client sees"). */
export const VISIBLE_QUOTE_STATUSES: QuoteStatus[] = ['sent', 'accepted']; // never `draft`, never `refused`
export const VISIBLE_INVOICE_STATUSES: InvoiceStatus[] = [
  'sent',
  'partially_paid',
  'paid',
]; // never `draft`, never `cancelled`

/** How many report photos the overview shows. */
export const MAX_PORTAL_PHOTOS = 12;

/** 32 random bytes → a 43-character URL-safe token. Shown to the staff member ONCE. */
export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

/** sha256 of the token — the only thing stored. A database leak gives nobody portal access. */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/** The URL the staff member sends the client: `PORTAL_BASE_URL` already ends in `/portal`. */
export function buildPortalUrl(rawToken: string): string {
  return `${env.PORTAL_BASE_URL.replace(/\/+$/, '')}/${rawToken}`;
}

/** Checks 2 and 3 of the token guard: still active, and not past `expires_at`. */
export function isTokenUsable(
  token: { isActive: boolean; expiresAt: Date },
  now: Date = new Date(),
): boolean {
  return token.isActive && token.expiresAt.getTime() > now.getTime();
}

export function expiryFromNow(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
