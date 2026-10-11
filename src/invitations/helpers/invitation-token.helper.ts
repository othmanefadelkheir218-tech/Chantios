import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env.config';

/** 7 days (doc/notes/auth-tokens.md § user_invitations). */
export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** The raw value lives only in the email link — the row stores its sha256. */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The link in the email: the frontend page that accepts the invitation (no locale — the frontend adds it). */
export function toAcceptUrl(rawToken: string): string {
  return `${env.APP_URL}/invitations/accept?token=${rawToken}`;
}
