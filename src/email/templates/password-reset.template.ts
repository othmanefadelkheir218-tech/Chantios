import { renderEmailLayout } from './email-layout';
import { EmailLocale } from './invite-employee.template';

/** `forgot-password.handler.ts` builds the email from this. Locale decision: doc/notes/alerts.md § "Email templates & language". */
const COPY: Record<
  EmailLocale,
  { subject: string; title: string; intro: string; expiry: string }
> = {
  fr: {
    subject: 'Réinitialisation du mot de passe — ChantiOs',
    title: 'Réinitialisation du mot de passe',
    intro: 'Voici votre code de réinitialisation :',
    expiry:
      "Il expire dans 1 heure. Si vous n'avez rien demandé, ignorez cet email.",
  },
  en: {
    subject: 'Password reset — ChantiOs',
    title: 'Password reset',
    intro: 'Here is your password reset code:',
    expiry:
      'It expires in 1 hour. If you did not request this, ignore this email.',
  },
  nl: {
    subject: 'Wachtwoord opnieuw instellen — ChantiOs',
    title: 'Wachtwoord opnieuw instellen',
    intro: 'Hier is uw code om uw wachtwoord opnieuw in te stellen:',
    expiry:
      'Ze vervalt over 1 uur. Hebt u dit niet aangevraagd, negeer dan deze e-mail.',
  },
};

export function passwordResetTemplate(
  code: string,
  locale: EmailLocale = 'en',
) {
  const copy = COPY[locale] ?? COPY.en;
  return {
    subject: copy.subject,
    html: renderEmailLayout({
      locale: COPY[locale] ? locale : 'en',
      title: copy.title,
      bodyHtml: `<p style="margin:0;">${copy.intro}</p>`,
      code,
      note: copy.expiry,
    }),
  };
}
