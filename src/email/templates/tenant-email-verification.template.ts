import { EmailLocale } from './invite-employee.template';

/** `send-tenant-verification-email.handler.ts` and `register-tenant.handler.ts` build the email from this. Locale decision: doc/notes/alerts.md § "Email templates & language". */
const COPY: Record<
  EmailLocale,
  { subject: string; intro: string; expiry: string }
> = {
  fr: {
    subject: 'Vérifiez votre email — ChantierOS',
    intro: 'Voici votre code de vérification :',
    expiry:
      "Il expire dans 24 heures. Si vous n'avez rien demandé, ignorez cet email.",
  },
  en: {
    subject: 'Verify your email — ChantierOS',
    intro: 'Here is your verification code:',
    expiry:
      'It expires in 24 hours. If you did not request this, ignore this email.',
  },
  ar: {
    subject: 'تحقق من بريدك الإلكتروني — ChantierOS',
    intro: 'إليك رمز التحقق الخاص بك:',
    expiry: 'تنتهي صلاحيته خلال 24 ساعة. إذا لم تطلب ذلك، تجاهل هذا البريد.',
  },
};

export function tenantEmailVerificationTemplate(
  code: string,
  locale: EmailLocale = 'en',
) {
  const copy = COPY[locale] ?? COPY.en;
  return {
    subject: copy.subject,
    html: `
      <p>${copy.intro}</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p>
      <p>${copy.expiry}</p>
    `,
  };
}
