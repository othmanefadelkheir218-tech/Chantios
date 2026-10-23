import { env } from '../../config/env.config';

const REPLY_PREFIX = 'reply-';

export interface OurRecipients {
  /** `reply-<token>@…` recipients: a reply to a company-inbox topic. */
  replyTokens: string[];
  /** Every other local part on our domain: a company or a Gmail forward address. */
  localParts: string[];
}

/** `"X" <a@b>` or `a@b` → the local part, when the domain is ours. */
function ownLocalPart(address: string, domain: string): string | null {
  const match = /<?([^<>\s@"]+)@([^<>\s@"]+?)>?\s*$/.exec(address.trim());
  if (!match) return null;
  return match[2].toLowerCase() === domain.toLowerCase()
    ? match[1].toLowerCase()
    : null;
}

/**
 * Which of our addresses received this email (B5). `received_for` is what
 * Resend really delivered to (a Gmail forward keeps the client in `To`), then
 * `To` and `Cc`. Reply tokens come first: they name the exact topic.
 */
export function ourRecipients(
  lists: (string[] | null | undefined)[],
  domain = env.INBOUND_EMAIL_DOMAIN,
): OurRecipients {
  const replyTokens: string[] = [];
  const localParts: string[] = [];
  for (const list of lists) {
    for (const address of list ?? []) {
      const local = ownLocalPart(address, domain);
      if (!local) continue;
      if (local.startsWith(REPLY_PREFIX)) {
        const token = local.slice(REPLY_PREFIX.length);
        if (token && !replyTokens.includes(token)) replyTokens.push(token);
      } else if (!localParts.includes(local)) {
        localParts.push(local);
      }
    }
  }
  return { replyTokens, localParts };
}
