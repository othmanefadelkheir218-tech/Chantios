import { renderEmailLayout } from './email-layout';
import { EmailLocale } from './invite-employee.template';

/** `send-tenant-verification-email.handler.ts` and `register-tenant.handler.ts` build the email from this. Locale decision: doc/notes/alerts.md § "Email templates & language". */
const COPY: Record<
  EmailLocale,
  { subject: string; title: string; intro: string; expiry: string }
> = {
  fr: {
    subject: 'Vérifiez votre email — ChantiOs',
    title: 'Vérifiez votre email',
    intro: 'Voici votre code de vérification :',
    expiry:
      "Il expire dans 24 heures. Si vous n'avez rien demandé, ignorez cet email.",
  },
  en: {
    subject: 'Verify your email — ChantiOs',
    title: 'Verify your email',
    intro: 'Here is your verification code:',
    expiry:
      'It expires in 24 hours. If you did not request this, ignore this email.',
  },
  nl: {
    subject: 'Bevestig uw e-mailadres — ChantiOs',
    title: 'Bevestig uw e-mailadres',
    intro: 'Hier is uw verificatiecode:',
    expiry:
      'Ze vervalt over 24 uur. Hebt u dit niet aangevraagd, negeer dan deze e-mail.',
  },
};

export function tenantEmailVerificationTemplate(
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
