/**
 * Step 27 — the company's TVA number (doc/notes/subscription-plans.md § TVA on
 * the subscription). Format only; whether it really exists is VIES's answer
 * (`CheckVatNumberHandler`).
 */

/** The number part after the 2-letter prefix, per EU country (the VIES formats). */
const EU_VAT_FORMATS: Record<string, RegExp> = {
  AT: /^U\d{8}$/,
  BE: /^[01]\d{9}$/,
  BG: /^\d{9,10}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^\d{8}$/,
  FR: /^[A-HJ-NP-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/,
  HU: /^\d{8}$/,
  IE: /^[0-9A-Z+*]{8,9}$/,
  IT: /^\d{11}$/,
  LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{12}$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
  XI: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
};

/** A number from outside the EU: a 2-letter prefix, then 2 to 14 letters / digits with at least 2 digits ("HELLO" is not a number). */
const OTHER_VAT_FORMAT = /^[A-Z]{2}(?=(?:[A-Z]*\d){2})[0-9A-Z]{2,14}$/;

/** "be 0123.456.789" → "BE0123456789". Empty → null. */
export function normalizeVatNumber(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const clean = value.replace(/[\s.\-/]/g, '').toUpperCase();
  return clean || null;
}

/** The 2-letter prefix of a normalized number ("BE"). */
export function vatPrefix(normalized: string): string {
  return normalized.slice(0, 2);
}

/** VIES checks only EU numbers (and Northern Ireland, XI). */
export function isEuVatNumber(normalized: string): boolean {
  return vatPrefix(normalized) in EU_VAT_FORMATS;
}

/** Format check: an EU number must match its country's format. */
export function isValidVatNumberFormat(normalized: string): boolean {
  const format = EU_VAT_FORMATS[vatPrefix(normalized)];
  if (format) return format.test(normalized.slice(2));
  return OTHER_VAT_FORMAT.test(normalized);
}
