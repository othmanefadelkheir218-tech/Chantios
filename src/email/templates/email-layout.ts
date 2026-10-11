import type { EmailLocale } from './invite-employee.template';

/**
 * The one layout every email uses — see DESIGN.md § 6. 600 px, one column,
 * tables and inline styles only (mail programs ignore most modern CSS).
 * Black header with the ChantiOs wordmark and an orange line, white body,
 * one orange button, black footer.
 */
const BLACK = '#0B0B0C';
const ORANGE = '#FF6A00';
const ORANGE_SOFT = '#FFF1E6';
const GREY_BG = '#F4F4F5';
const GREY_LINE = '#D4D4D8';
const GREY_TEXT = '#52525B';
const FONT = 'Arial, Helvetica, sans-serif';

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
    ? `<div style="margin:24px 0;padding:16px;background:${ORANGE_SOFT};border:1px solid ${ORANGE};border-radius:8px;text-align:center;font-family:${FONT};font-size:32px;font-weight:bold;letter-spacing:8px;color:${BLACK};">${escapeHtml(code)}</div>`
    : '';

  const buttonBlock = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="background:${ORANGE};border-radius:8px;"><a href="${button.url}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:bold;color:${BLACK};text-decoration:none;">${button.label}</a></td></tr></table>
<p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${GREY_TEXT};">${FALLBACK_LINK[locale]}<br><a href="${button.url}" style="color:${BLACK};word-break:break-all;">${button.url}</a></p>`
    : '';

  const noteBlock = note
    ? `<p style="margin:24px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${GREY_TEXT};">${note}</p>`
    : '';

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${GREY_BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GREY_BG};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid ${GREY_LINE};">
<tr><td style="background:${BLACK};padding:24px 32px;font-family:${FONT};font-size:26px;font-weight:bold;color:#FFFFFF;">Chanti<span style="color:${ORANGE};">Os</span></td></tr>
<tr><td style="background:${ORANGE};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:32px;font-family:${FONT};font-size:16px;line-height:1.5;color:${BLACK};">
<h1 style="margin:0 0 16px;font-family:${FONT};font-size:24px;line-height:1.3;color:${BLACK};">${title}</h1>
${bodyHtml}
${codeBlock}
${buttonBlock}
${noteBlock}
</td></tr>
<tr><td style="background:${BLACK};padding:20px 32px;font-family:${FONT};font-size:12px;line-height:1.5;color:#A1A1AA;">${FOOTER[locale]}<br>&copy; ChantiOs</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
