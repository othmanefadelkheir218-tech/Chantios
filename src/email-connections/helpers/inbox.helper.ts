import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.config';
import type { InboxWithAddresses } from '../repositories/email-inbox.repository';

/** The prefix of every reply address: `reply-<topic token>@<domain>`. Never a company name. */
export const REPLY_PREFIX = 'reply-';

/** Same rule as the DB CHECK `chk_email_local_part`. */
export const LOCAL_PART_PATTERN = /^[a-z0-9][a-z0-9.-]{1,62}[a-z0-9]$/;

const FORWARD_SUFFIX_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export function fullAddress(localPart: string): string {
  return `${localPart}@${env.INBOUND_EMAIL_DOMAIN}`;
}

export function replyAddress(token: string): string {
  return `${REPLY_PREFIX}${token}@${env.INBOUND_EMAIL_DOMAIN}`;
}

/** `Maçonnerie Dubois & Fils` → `maconnerie-dubois-fils` (max 40 characters). */
export function slugLocalPart(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  const safe = slug.startsWith(REPLY_PREFIX) ? `co-${slug}` : slug;
  return safe.length >= 3 ? safe : `company-${safe || 'x'}`;
}

/**
 * The personal forward address of one Gmail: `<company>.<random>`. Long and
 * random, so nobody can guess another user's address.
 */
export function forwardLocalPart(base: string): string {
  const bytes = randomBytes(10);
  const suffix = [...bytes]
    .map(
      (byte) => FORWARD_SUFFIX_ALPHABET[byte % FORWARD_SUFFIX_ALPHABET.length],
    )
    .join('');
  return `${base.slice(0, 50)}.${suffix}`;
}

function primaryOf(inbox: InboxWithAddresses) {
  return inbox.addresses.find((address) => address.isPrimary) ?? null;
}

/** The company inbox: its address and the old ones that still work. */
export function toCompanyInboxEntity(inbox: InboxWithAddresses) {
  const primary = primaryOf(inbox);
  return {
    id: inbox.id,
    kind: inbox.kind,
    status: inbox.status,
    address: primary ? fullAddress(primary.localPart) : null,
    localPart: primary?.localPart ?? null,
    oldAddresses: inbox.addresses
      .filter((address) => !address.isPrimary)
      .map((address) => fullAddress(address.localPart)),
    lastReceivedAt: inbox.lastReceivedAt,
  };
}

/**
 * A Gmail inbox. The owner sees the forward address and Gmail's confirm
 * link; anyone else (a user with `settings`) sees the status only.
 */
export function toGmailInboxEntity(
  inbox: InboxWithAddresses,
  isOwner: boolean,
  ownerName: string | null,
) {
  const status = {
    id: inbox.id,
    kind: inbox.kind,
    status: inbox.status,
    gmailAddress: inbox.gmailAddress,
    ownerUserId: inbox.ownerUserId,
    ownerName,
    isMine: isOwner,
    lastError: inbox.lastError,
    connectedAt: inbox.connectedAt,
    disconnectedAt: inbox.disconnectedAt,
  };
  if (!isOwner) return status;
  const primary = primaryOf(inbox);
  return {
    ...status,
    forwardAddress: primary ? fullAddress(primary.localPart) : null,
    forwardConfirmUrl: inbox.forwardConfirmUrl,
    lastUsedAt: inbox.lastUsedAt,
    lastReceivedAt: inbox.lastReceivedAt,
  };
}
