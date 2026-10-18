import type { EmailLocale } from './invite-employee.template';

/**
 * The one layout every email uses — same look as the web app (navy, burnt
 * orange, soft grey page, white rounded card). 600 px, one column, tables and
 * inline styles only (mail programs ignore most modern CSS).
 * Navy header with the ChantiOs wordmark and a thin orange line, white body,
 * one orange button (white text), small grey footer under the card.
 */
const NAVY = '#131C2E';
const TEXT = '#0F172A';
const BODY_TEXT = '#334155';
const MUTED = '#64748B';
const ORANGE = '#C2570C';
const ORANGE_SOFT = '#FFF4EC';
const ORANGE_LINE = '#F5C6A0';
const PAGE_BG = '#F1F5F9';
const LINE = '#E2E8F0';
const FONT = "Inter, 'Segoe UI', Arial, Helvetica, sans-serif";

const FOOTER: Record<EmailLocale, string> = {
  fr: 'Cet email a été envoyé automatiquement. Merci de ne pas y répondre.',
  en: 'This email was sent automatically. Please do not reply.',
  nl: 'Deze e-mail werd automatisch verzonden. Gelieve niet te antwoorden.',
};

const FALLBACK_LINK: Record<EmailLocale, string> = {
  fr: 'Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :',
  en: 'The button does not work? Copy this link into your browser:',
  nl: 'Werkt de knop niet? Kopieer deze link in uw browser:',
};

/** Free text that may hold user input (company names, previews) must pass through this. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A missing or unknown locale falls back to English (doc/notes/alerts.md). */
export function toEmailLocale(locale: string | null | undefined): EmailLocale {
  return locale === 'fr' || locale === 'nl' ? locale : 'en';
}

/** Link color inside an email body (the portal link of a notification). */
export const EMAIL_LINK_COLOR = ORANGE;

export interface EmailSummaryRow {
  /** HTML-safe label (static text, or escaped by the caller). */
  label: string;
  /** HTML-safe value (already formatted and escaped). */
  value: string;
  /** Small grey line under the label (a period...). HTML-safe. */
  hint?: string;
}

/**
 * A receipt-style box: one row per line (label left, amount right), then a
 * strong total row in navy. Used by the payment email.
 */
export function renderEmailSummary(
  rows: EmailSummaryRow[],
  total: { label: string; value: string },
): string {
  const cell = `font-family:${FONT};font-size:15px;line-height:1.4;padding:12px 16px;border-bottom:1px solid ${LINE};`;
  const body = rows
    .map(
      (row) =>
        `<tr><td style="${cell}color:${TEXT};">${row.label}${row.hint ? `<br><span style="font-size:13px;color:${MUTED};">${row.hint}</span>` : ''}</td><td align="right" style="${cell}color:${TEXT};font-weight:bold;white-space:nowrap;">${row.value}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border:1px solid ${LINE};border-radius:12px;border-collapse:separate;overflow:hidden;">
${body}
<tr><td style="font-family:${FONT};font-size:16px;font-weight:bold;padding:16px;background:${NAVY};color:#FFFFFF;">${total.label}</td><td align="right" style="font-family:${FONT};font-size:20px;font-weight:bold;padding:16px;background:${NAVY};color:#FFFFFF;white-space:nowrap;">${total.value}</td></tr>
</table>`;
}

export interface EmailLayoutInput {
  locale: EmailLocale;
  /** Big title. Must already be HTML-safe (static text, or escaped by the caller). */
  title: string;
  /** Body HTML. The caller escapes any user input in it. */
  bodyHtml: string;
  /** The one orange button. `label` is static text; `url` must be already escaped. */
  button?: { label: string; url: string };
  /** A short code (verification, reset) shown in a big box. */
  code?: string;
  /** Small grey text under the content (expiry, "ignore this email"). Static text. */
  note?: string;
}

export function renderEmailLayout(input: EmailLayoutInput): string {
  const { locale, title, bodyHtml, button, code, note } = input;

  const codeBlock = code
    ? `<div style="margin:24px 0;padding:20px 16px;background:${ORANGE_SOFT};border:1px solid ${ORANGE_LINE};border-radius:12px;text-align:center;font-family:${FONT};font-size:32px;font-weight:bold;letter-spacing:8px;color:${TEXT};">${escapeHtml(code)}</div>`
    : '';

  const buttonBlock = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:${ORANGE};border-radius:12px;"><a href="${button.url}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:12px;">${button.label}</a></td></tr></table>
<p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};">${FALLBACK_LINK[locale]}<br><a href="${button.url}" style="color:${ORANGE};word-break:break-all;">${button.url}</a></p>`
    : '';

  const noteBlock = note
    ? `<p style="margin:28px 0 0;padding-top:16px;border-top:1px solid ${LINE};font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};">${note}</p>`
    : '';

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid ${LINE};">
<tr><td style="background:${NAVY};padding:22px 32px;font-family:${FONT};font-size:24px;font-weight:bold;letter-spacing:-0.3px;color:#FFFFFF;">Chanti<span style="color:${ORANGE};">Os</span></td></tr>
<tr><td style="background:${ORANGE};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:36px 32px 32px;font-family:${FONT};font-size:16px;line-height:1.6;color:${BODY_TEXT};">
<h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:bold;color:${TEXT};">${title}</h1>
${bodyHtml}
${codeBlock}
${buttonBlock}
${noteBlock}
</td></tr>
</table>
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td align="center" style="padding:20px 32px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};">${FOOTER[locale]}<br>&copy; Chanti<span style="color:${ORANGE};">Os</span></td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
