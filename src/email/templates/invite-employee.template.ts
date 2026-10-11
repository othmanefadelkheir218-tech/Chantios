import { escapeHtml, renderEmailLayout } from './email-layout';

/** `create-invitation.handler.ts` builds the email from this. Locale decision: doc/notes/alerts.md § "Email templates & language". */
export type EmailLocale = 'fr' | 'en' | 'nl';

const COPY: Record<
  EmailLocale,
  {
    subject: string;
    title: string;
    intro: string;
    cta: string;
    button: string;
    expiry: string;
  }
> = {
  fr: {
    subject: 'Vous êtes invité — ChantiOs',
    title: 'Vous êtes invité',
    intro: 'vous a invité à rejoindre son équipe sur ChantiOs.',
    cta: 'Choisissez votre mot de passe pour activer votre compte.',
    button: 'Activer mon compte',
    expiry: 'Ce lien expire dans 7 jours.',
  },
  en: {
    subject: "You're invited — ChantiOs",
    title: "You're invited",
    intro: 'has invited you to join their team on ChantiOs.',
    cta: 'Set your password to activate your account.',
    button: 'Activate my account',
    expiry: 'This link expires in 7 days.',
  },
  nl: {
    subject: 'U bent uitgenodigd — ChantiOs',
    title: 'U bent uitgenodigd',
    intro: 'heeft u uitgenodigd om zijn team te vervoegen op ChantiOs.',
    cta: 'Kies uw wachtwoord om uw account te activeren.',
    button: 'Account activeren',
    expiry: 'Deze link vervalt over 7 dagen.',
  },
};

export function inviteEmployeeTemplate(
  companyName: string,
  acceptUrl: string,
  locale: EmailLocale = 'en',
) {
  const copy = COPY[locale] ?? COPY.en;
  return {
    subject: copy.subject,
    html: renderEmailLayout({
      locale: COPY[locale] ? locale : 'en',
      title: copy.title,
      bodyHtml: `<p style="margin:0 0 12px;"><strong>${escapeHtml(companyName)}</strong> ${copy.intro}</p><p style="margin:0;">${copy.cta}</p>`,
      button: { label: copy.button, url: escapeHtml(acceptUrl) },
      note: copy.expiry,
    }),
  };
}
