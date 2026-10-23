import { stripSubjectCode } from '../../common/helpers/subject-code.helper';

/**
 * Reading a received email (doc/notes/client-email.md § What we save, § Where
 * it shows): the clean text without the quoted old messages, the thread ids,
 * the subject without `Re:` / `Fwd:`, and the auto-replies we ignore.
 */

/** Where the quoted part of a reply starts, per mail app and language. */
const QUOTE_HEADERS: RegExp[] = [
  // Gmail / Apple Mail, en: "On Mon, 13 Oct 2026 at 10:02, Eya <eya@x.com> wrote:" (may wrap)
  /^[ \t]*On\b[^\n]*(?:\n[^\n]*){0,2}?\bwrote:[ \t]*$/im,
  // fr: "Le lun. 13 oct. 2026 à 10:02, Eya <eya@x.com> a écrit :"
  /^[ \t]*Le\b[^\n]*(?:\n[^\n]*){0,2}?\ba écrit[ \t]*:[ \t]*$/im,
  // nl: "Op ma 13 okt 2026 om 10:02 schreef Eya <eya@x.com>:"
  /^[ \t]*Op\b[^\n]*(?:\n[^\n]*){0,2}?\bschreef\b[^\n]*:[ \t]*$/im,
  // de: "Am Mo., 13. Okt. 2026 um 10:02 Uhr schrieb Eya <eya@x.com>:"
  /^[ \t]*Am\b[^\n]*(?:\n[^\n]*){0,2}?\bschrieb\b[^\n]*:[ \t]*$/im,
  // Outlook: "-----Original Message-----", "----- Message d'origine -----"
  /^[ \t]*-{2,}[ \t]*(?:Original Message|Message d'origine|Oorspronkelijk bericht|Ursprüngliche Nachricht)[ \t]*-{2,}/im,
  // Outlook without the dash line: "De : Eya" then "Envoyé : …" within a few lines
  /^[ \t]*\*?(?:From|De|Van|Von)\*?[ \t]*:[^\n]*\n(?:[^\n]*\n){0,3}?[ \t]*\*?(?:Sent|Envoyé|Verzonden|Gesendet|Date|Datum)\*?[ \t]*:/im,
  // Outlook mobile / some clients: a line of underscores before the header block
  /^[ \t]*_{10,}[ \t]*$/m,
];

/** A signature separator: "-- " alone on its line. */
const SIGNATURE = /^-- ?$/m;
/** Gmail's text version of an inline image. */
const IMAGE_PLACEHOLDER = /\[image:[^\]]*\]/gi;

/**
 * The text the client really wrote: quotes, signature and `[image: …]` cut.
 * When the cut leaves nothing (a reply typed under the quote), the full text
 * is kept — never an empty message.
 */
export function cleanEmailText(text: string | null | undefined): string {
  if (!text) return '';
  const full = text.replace(/\r\n/g, '\n').replace(IMAGE_PLACEHOLDER, '');
  let cut = full.length;
  for (const pattern of [...QUOTE_HEADERS, SIGNATURE]) {
    const match = pattern.exec(full);
    if (match && match.index < cut) cut = match.index;
  }
  const lines = full.slice(0, cut).split('\n');
  // Trailing "> quoted" lines with no header above them.
  while (lines.length > 0 && /^\s*(>.*)?$/.test(lines[lines.length - 1])) {
    lines.pop();
  }
  const clean = lines
    .join('\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return clean || full.replace(/\n{3,}/g, '\n\n').trim();
}

const REPLY_PREFIX =
  /^\s*(?:(?:re|fwd?|tr|aw|antw|wg|rv|sv|réf|ref)\s*(?:\[\d+\])?\s*:\s*)+/i;

/** `RE: Fwd: Devis cuisine [#K7Q2M9]` → `Devis cuisine`. */
export function cleanSubject(subject: string | null | undefined): string {
  const stripped = stripSubjectCode((subject ?? '').replace(REPLY_PREFIX, ''))
    .replace(REPLY_PREFIX, '')
    .trim();
  return (stripped || '(no subject)').slice(0, 998);
}

/** Every `<id@host>` in a `References` / `In-Reply-To` header, in order. */
export function parseMessageIds(header: string | null | undefined): string[] {
  if (!header) return [];
  return [...header.matchAll(/<[^<>\s]+>/g)].map((match) => match[0]);
}

/** `Eya Jarraya <Eya@Mail.com>` → `{ address: 'eya@mail.com', name: 'Eya Jarraya' }`. */
export function parseAddress(value: string): {
  address: string;
  name: string | null;
} {
  const match = /^\s*"?([^"<]*?)"?\s*<([^<>\s]+@[^<>\s]+)>\s*$/.exec(value);
  if (match) {
    return {
      address: match[2].toLowerCase(),
      name: match[1].trim() || null,
    };
  }
  return { address: value.trim().toLowerCase(), name: null };
}

/** Header lookup, any case (Resend gives the names as sent). */
export function header(
  headers: Record<string, string> | null | undefined,
  name: string,
): string | null {
  if (!headers) return null;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return null;
}

/**
 * An automatic answer (holiday reply, bounce-like robot): kept as an event,
 * never a message, never an alert.
 */
export function isAutoReply(
  headers: Record<string, string> | null | undefined,
): boolean {
  const autoSubmitted = header(headers, 'auto-submitted');
  if (autoSubmitted && autoSubmitted.trim().toLowerCase() !== 'no') return true;
  if (header(headers, 'x-autoreply') || header(headers, 'x-autorespond')) {
    return true;
  }
  const precedence = header(headers, 'precedence')?.trim().toLowerCase();
  return (
    precedence === 'bulk' ||
    precedence === 'auto_reply' ||
    precedence === 'junk'
  );
}

/**
 * An email sent by ChantierOS itself (an alert, a reset…) that came back,
 * e.g. through a personal Gmail that forwards everything. Never a message:
 * saving it would alert again → a new email → a loop.
 */
export function isOwnEmail(fromAddress: string, ownSender: string): boolean {
  return fromAddress.trim().toLowerCase() === ownSender.trim().toLowerCase();
}

/** Gmail's "confirm forwarding" email comes from this sender. */
export const GMAIL_FORWARD_CONFIRM_SENDER = 'forwarding-noreply@google.com';

/** The confirm link inside Gmail's forwarding email, or null. */
export function extractForwardConfirmLink(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const match =
    /https:\/\/mail(?:-settings)?\.google\.com\/mail\/[^\s<>"]*vf-[^\s<>"]+/i.exec(
      text,
    );
  return match ? match[0] : null;
}

/** First characters of the clean text, for an alert. */
export function preview(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
