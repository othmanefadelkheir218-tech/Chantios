/** `create-invitation.handler.ts` builds the email from this. Locale decision: doc/notes/alerts.md § "Email templates & language". */
export type EmailLocale = 'fr' | 'en' | 'ar';

const COPY: Record<
  EmailLocale,
  { subject: string; intro: string; cta: string; expiry: string }
> = {
  fr: {
    subject: 'Vous êtes invité — ChantierOS',
    intro: 'a vous invité à rejoindre son équipe sur ChantierOS.',
    cta: 'Choisissez votre mot de passe pour activer votre compte :',
    expiry: 'Ce lien expire dans 7 jours.',
  },
  en: {
    subject: "You're invited — ChantierOS",
    intro: 'has invited you to join their team on ChantierOS.',
    cta: 'Set your password to activate your account:',
    expiry: 'This link expires in 7 days.',
  },
  ar: {
    subject: 'تمت دعوتك — ChantierOS',
    intro: 'قام بدعوتك للانضمام إلى فريقه على ChantierOS.',
    cta: 'اختر كلمة المرور لتفعيل حسابك:',
    expiry: 'تنتهي صلاحية هذا الرابط خلال 7 أيام.',
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
    html: `
      <p><strong>${companyName}</strong> ${copy.intro}</p>
      <p>${copy.cta}</p>
      <p><a href="${acceptUrl}">${acceptUrl}</a></p>
      <p>${copy.expiry}</p>
    `,
  };
}
