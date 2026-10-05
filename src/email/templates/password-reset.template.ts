import { EmailLocale } from './invite-employee.template';

/** `forgot-password.handler.ts` builds the email from this. Locale decision: doc/notes/alerts.md § "Email templates & language". */
const COPY: Record<
  EmailLocale,
  { subject: string; intro: string; expiry: string }
> = {
  fr: {
    subject: 'Réinitialisation du mot de passe — ChantierOS',
    intro: 'Voici votre code de réinitialisation :',
    expiry:
      "Il expire dans 1 heure. Si vous n'avez rien demandé, ignorez cet email.",
  },
  en: {
    subject: 'Password reset — ChantierOS',
    intro: 'Here is your password reset code:',
    expiry:
      'It expires in 1 hour. If you did not request this, ignore this email.',
  },
  ar: {
    subject: 'إعادة تعيين كلمة المرور — ChantierOS',
    intro: 'إليك رمز إعادة تعيين كلمة المرور الخاص بك:',
    expiry: 'تنتهي صلاحيته خلال ساعة واحدة. إذا لم تطلب ذلك، تجاهل هذا البريد.',
  },
};

export function passwordResetTemplate(
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
