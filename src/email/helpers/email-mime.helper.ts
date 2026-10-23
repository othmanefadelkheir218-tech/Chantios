import { randomBytes } from 'node:crypto';

/**
 * Raw MIME for an email we send through the Gmail API (doc/notes/client-email.md
 * § Replying). We never set our own `Message-ID`: Gmail and Resend replace it
 * anyway (spike 2026-10-18).
 */

/** RFC 2047 — keeps accents readable in a header. */
export function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

/** `"Dubois Rénovation" <x@y>` — the name encoded when it needs it. */
export function formatAddress(address: string, name?: string | null): string {
  if (!name) return address;
  const safe = name.replace(/["\\\r\n]/g, '');
  return /^[\x20-\x7e]*$/.test(safe)
    ? `"${safe}" <${address}>`
    : `${encodeHeader(safe)} <${address}>`;
}

/** Plain text a user typed → a simple HTML body (the text escaped, lines kept). */
export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${escaped.replace(/\r?\n/g, '<br>')}</div>`;
}

/** Base64 cut in 76-character lines, as MIME wants it. */
function base64Lines(content: Buffer): string {
  return (
    content
      .toString('base64')
      .match(/.{1,76}/g)
      ?.join('\r\n') ?? ''
  );
}

export interface MimeAttachment {
  filename: string;
  mimeType: string;
  content: Buffer;
}

export interface MimeEmail {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string | null;
  references?: string[];
  replyTo?: string | null;
  attachments?: MimeAttachment[];
}

/** `In-Reply-To` + `References` lines, when replying. */
export function threadHeaders(
  inReplyTo?: string | null,
  references: string[] = [],
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
  const refs = [...new Set(references.filter(Boolean))];
  if (refs.length > 0) headers['References'] = refs.join(' ');
  return headers;
}

/** The full raw email, CRLF line ends, ready for `users.messages.send`. */
export function buildRawMime(email: MimeEmail): string {
  const boundary = (label: string) =>
    `=_${label}_${randomBytes(12).toString('hex')}`;
  const alt = boundary('alt');
  const headers: string[] = [
    `From: ${email.from}`,
    `To: ${email.to.join(', ')}`,
    ...(email.cc && email.cc.length > 0 ? [`Cc: ${email.cc.join(', ')}`] : []),
    `Subject: ${encodeHeader(email.subject)}`,
    ...(email.replyTo ? [`Reply-To: ${email.replyTo}`] : []),
    ...Object.entries(threadHeaders(email.inReplyTo, email.references)).map(
      ([key, value]) => `${key}: ${value}`,
    ),
    'MIME-Version: 1.0',
  ];

  const alternative = [
    `--${alt}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(Buffer.from(email.text, 'utf8')),
    `--${alt}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(Buffer.from(email.html, 'utf8')),
    `--${alt}--`,
  ].join('\r\n');

  const files = email.attachments ?? [];
  if (files.length === 0) {
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${alt}"`,
      '',
      alternative,
      '',
    ].join('\r\n');
  }

  const mixed = boundary('mixed');
  const parts = files.map((file) => {
    const name = encodeHeader(file.filename.replace(/["\r\n]/g, ''));
    return [
      `--${mixed}`,
      `Content-Type: ${file.mimeType}; name="${name}"`,
      `Content-Disposition: attachment; filename="${name}"`,
      'Content-Transfer-Encoding: base64',
      '',
      base64Lines(file.content),
    ].join('\r\n');
  });
  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${mixed}"`,
    '',
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    '',
    alternative,
    ...parts,
    `--${mixed}--`,
    '',
  ].join('\r\n');
}
