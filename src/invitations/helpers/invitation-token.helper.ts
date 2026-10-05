import { createHash, randomBytes } from 'crypto';

/** 7 days (doc/notes/auth-tokens.md § user_invitations). */
export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** The raw value lives only in the email link — the row stores its sha256. */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
