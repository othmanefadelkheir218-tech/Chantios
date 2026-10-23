import { randomInt } from 'node:crypto';

/**
 * The topic code at the end of the subject of every email sent from a Gmail
 * inbox: `Devis cuisine [#K7Q2M9]` (doc/notes/client-email.md § How a
 * client's reply finds its topic, D3). One place for its shape: chat makes
 * it, email-connections writes it, inbound-email reads it back.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SUBJECT_CODE_LENGTH = 6;
const CODE_IN_SUBJECT = /\[#([A-HJ-NP-Z2-9]{6})\]/g;

export function newSubjectCode(): string {
  let code = '';
  for (let i = 0; i < SUBJECT_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/** `Devis cuisine` + `K7Q2M9` → `Devis cuisine [#K7Q2M9]` (never twice). */
export function withSubjectCode(subject: string, code: string): string {
  return `${stripSubjectCode(subject)} [#${code}]`.trim();
}

/** The LAST code in a subject (a reply keeps it), or null. */
export function readSubjectCode(
  subject: string | null | undefined,
): string | null {
  if (!subject) return null;
  const matches = [...subject.toUpperCase().matchAll(CODE_IN_SUBJECT)];
  return matches.at(-1)?.[1] ?? null;
}

/** The subject without any `[#code]`. */
export function stripSubjectCode(subject: string): string {
  return subject
    .replace(/\s*\[#[A-Za-z0-9]{6}\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
