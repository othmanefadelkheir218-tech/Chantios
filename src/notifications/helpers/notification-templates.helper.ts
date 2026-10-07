import { EmailLocale } from '../../email/templates/invite-employee.template';
import { NotificationType } from '../notification.types';

type Payload = Record<string, unknown>;
type Copy = (p: Payload) => { subject: string; body: string };
type LocaleCopy = Partial<Record<EmailLocale, Copy>> & { en: Copy };

/** One payload value as text, HTML-escaped (names and message previews are user input). */
function s(value: unknown): string {
  const text =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The portal link, only when the caller has one (the raw token is shown once, never stored). */
function link(p: Payload): string {
  const url = s(p.portal_url);
  return url ? `<br><a href="${url}">${url}</a>` : '';
}

const c =
  (subject: (p: Payload) => string, body: (p: Payload) => string): Copy =>
  (p) => ({ subject: subject(p), body: body(p) });

/**
 * Subject + body for every alert, per locale (`fr`, `en`, `ar`; a missing or
 * unknown locale falls back to `en`). The platform alerts are for ChantierOS
 * staff and exist in English only. The same copy feeds the in-app text and
 * the email.
 */
const TEMPLATES: Record<NotificationType, LocaleCopy> = {
  low_stock: {
    en: c(
      (p) => `Low stock: ${s(p.material_name)}`,
      (p) =>
        `${s(p.material_name)} is at ${s(p.on_hand)} ${s(p.unit)}, at or below its minimum. Time to order.`,
    ),
    fr: c(
      (p) => `Stock bas : ${s(p.material_name)}`,
      (p) =>
        `${s(p.material_name)} est à ${s(p.on_hand)} ${s(p.unit)}, au niveau du minimum ou en dessous. Il faut commander.`,
    ),
    ar: c(
      (p) => `مخزون منخفض: ${s(p.material_name)}`,
      (p) =>
        `${s(p.material_name)} عند ${s(p.on_hand)} ${s(p.unit)}، أي عند الحد الأدنى أو أقل. حان وقت الطلب.`,
    ),
  },
  reservation_unmet: {
    en: c(
      (p) => `Reservation not covered: ${s(p.material_name)}`,
      (p) =>
        `Reservations for ${s(p.material_name)} are higher than the stock (short by ${s(p.short_by)}). Order more.`,
    ),
    fr: c(
      (p) => `Réservation non couverte : ${s(p.material_name)}`,
      (p) =>
        `Les réservations de ${s(p.material_name)} dépassent le stock (manque ${s(p.short_by)}). Commandez-en plus.`,
    ),
    ar: c(
      (p) => `حجز غير مغطى: ${s(p.material_name)}`,
      (p) =>
        `حجوزات ${s(p.material_name)} أكبر من المخزون (النقص ${s(p.short_by)}). اطلب المزيد.`,
    ),
  },
  margin_warning: {
    en: c(
      (p) => `Budget warning: ${s(p.project_name)}`,
      (p) =>
        `This project is approaching its budget limit (${s(p.cost_pct)}% of the budget is spent): ${s(p.project_name)}.`,
    ),
    fr: c(
      (p) => `Alerte budget : ${s(p.project_name)}`,
      (p) =>
        `Ce chantier approche de sa limite de budget (${s(p.cost_pct)} % du budget dépensé) : ${s(p.project_name)}.`,
    ),
    ar: c(
      (p) => `تنبيه الميزانية: ${s(p.project_name)}`,
      (p) =>
        `يقترب هذا المشروع من حد ميزانيته (${s(p.cost_pct)}٪ من الميزانية): ${s(p.project_name)}.`,
    ),
  },
  margin_critical: {
    en: c(
      (p) => `Budget critical: ${s(p.project_name)}`,
      (p) =>
        `This project is over budget — immediate review needed (${s(p.cost_pct)}% spent): ${s(p.project_name)}.`,
    ),
    fr: c(
      (p) => `Budget critique : ${s(p.project_name)}`,
      (p) =>
        `Ce chantier dépasse son budget — examen immédiat nécessaire (${s(p.cost_pct)} % dépensé) : ${s(p.project_name)}.`,
    ),
    ar: c(
      (p) => `الميزانية حرجة: ${s(p.project_name)}`,
      (p) =>
        `تجاوز هذا المشروع ميزانيته — مراجعة فورية مطلوبة (${s(p.cost_pct)}٪): ${s(p.project_name)}.`,
    ),
  },
  invoice_late: {
    en: c(
      (p) => `Late invoice ${s(p.invoice_ref)}`,
      (p) =>
        `Invoice ${s(p.invoice_ref)} is past its due date. Balance due: ${s(p.balance_due)}.`,
    ),
    fr: c(
      (p) => `Facture en retard ${s(p.invoice_ref)}`,
      (p) =>
        `La facture ${s(p.invoice_ref)} a dépassé son échéance. Solde dû : ${s(p.balance_due)}.`,
    ),
    ar: c(
      (p) => `فاتورة متأخرة ${s(p.invoice_ref)}`,
      (p) =>
        `الفاتورة ${s(p.invoice_ref)} تجاوزت موعد استحقاقها. الرصيد المستحق: ${s(p.balance_due)}.`,
    ),
  },
  invoice_paid: {
    en: c(
      (p) => `Invoice ${s(p.invoice_ref)} paid`,
      (p) => `Invoice ${s(p.invoice_ref)} is fully paid (${s(p.amount)}).`,
    ),
    fr: c(
      (p) => `Facture ${s(p.invoice_ref)} payée`,
      (p) =>
        `La facture ${s(p.invoice_ref)} est entièrement payée (${s(p.amount)}).`,
    ),
    ar: c(
      (p) => `تم دفع الفاتورة ${s(p.invoice_ref)}`,
      (p) => `الفاتورة ${s(p.invoice_ref)} مدفوعة بالكامل (${s(p.amount)}).`,
    ),
  },
  purchase_due: {
    en: c(
      (p) => `Supplier bill due: ${s(p.invoice_ref)}`,
      (p) =>
        `Bill ${s(p.invoice_ref)} is due on ${s(p.due_date)}. Pay it soon.`,
    ),
    fr: c(
      (p) => `Facture fournisseur à payer : ${s(p.invoice_ref)}`,
      (p) =>
        `La facture ${s(p.invoice_ref)} est due le ${s(p.due_date)}. À payer bientôt.`,
    ),
    ar: c(
      (p) => `فاتورة مورد مستحقة: ${s(p.invoice_ref)}`,
      (p) =>
        `الفاتورة ${s(p.invoice_ref)} مستحقة في ${s(p.due_date)}. ادفعها قريبا.`,
    ),
  },
  abnormal_hours: {
    en: c(
      (p) => `Abnormal hours: ${s(p.employee_name)}`,
      (p) =>
        `${s(p.employee_name)} logged ${s(p.hours)} h on ${s(p.date)} across all projects (more than 12 h).`,
    ),
    fr: c(
      (p) => `Heures anormales : ${s(p.employee_name)}`,
      (p) =>
        `${s(p.employee_name)} a déclaré ${s(p.hours)} h le ${s(p.date)} sur l'ensemble des chantiers (plus de 12 h).`,
    ),
    ar: c(
      (p) => `ساعات غير عادية: ${s(p.employee_name)}`,
      (p) =>
        `سجل ${s(p.employee_name)} ${s(p.hours)} ساعة في ${s(p.date)} عبر كل المشاريع (أكثر من 12 ساعة).`,
    ),
  },
  missing_timesheet: {
    en: c(
      (p) => `Missing timesheet: ${s(p.employee_name)}`,
      (p) =>
        `${s(p.employee_name)} has a task in progress today but no hours logged.`,
    ),
    fr: c(
      (p) => `Feuille d'heures manquante : ${s(p.employee_name)}`,
      (p) =>
        `${s(p.employee_name)} a une tâche en cours aujourd'hui mais aucune heure déclarée.`,
    ),
    ar: c(
      (p) => `ساعات غير مسجلة: ${s(p.employee_name)}`,
      (p) =>
        `لدى ${s(p.employee_name)} مهمة قيد التنفيذ اليوم ولكن لا ساعات مسجلة.`,
    ),
  },
  stalled_project: {
    en: c(
      (p) => `Stalled project: ${s(p.project_name)}`,
      (p) =>
        `No hours have been logged on ${s(p.project_name)} for ${s(p.days)} days.`,
    ),
    fr: c(
      (p) => `Chantier à l'arrêt : ${s(p.project_name)}`,
      (p) =>
        `Aucune heure n'a été déclarée sur ${s(p.project_name)} depuis ${s(p.days)} jours.`,
    ),
    ar: c(
      (p) => `مشروع متوقف: ${s(p.project_name)}`,
      (p) => `لم تسجل أي ساعات على ${s(p.project_name)} منذ ${s(p.days)} أيام.`,
    ),
  },
  missing_report: {
    en: c(
      (p) => `Missing site report: ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} is in progress with no site report for ${s(p.days)} days.`,
    ),
    fr: c(
      (p) => `Rapport de chantier manquant : ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} est en cours sans rapport de chantier depuis ${s(p.days)} jours.`,
    ),
    ar: c(
      (p) => `تقرير موقع مفقود: ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} قيد التنفيذ بدون تقرير موقع منذ ${s(p.days)} أيام.`,
    ),
  },
  progress_stalled: {
    en: c(
      (p) => `Progress stalled: ${s(p.project_name)}`,
      (p) =>
        `The progress of ${s(p.project_name)} has not moved for ${s(p.days)} days.`,
    ),
    fr: c(
      (p) => `Avancement bloqué : ${s(p.project_name)}`,
      (p) =>
        `L'avancement de ${s(p.project_name)} n'a pas bougé depuis ${s(p.days)} jours.`,
    ),
    ar: c(
      (p) => `التقدم متوقف: ${s(p.project_name)}`,
      (p) => `لم يتغير تقدم ${s(p.project_name)} منذ ${s(p.days)} أيام.`,
    ),
  },
  project_cancelled: {
    en: c(
      (p) => `Project cancelled: ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} was cancelled. Remember to invoice the client for the work already done.`,
    ),
    fr: c(
      (p) => `Chantier annulé : ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} a été annulé. Pensez à facturer le client pour le travail déjà réalisé.`,
    ),
    ar: c(
      (p) => `تم إلغاء المشروع: ${s(p.project_name)}`,
      (p) =>
        `تم إلغاء ${s(p.project_name)}. تذكر إصدار فاتورة للعميل عن العمل المنجز.`,
    ),
  },
  new_message: {
    en: c(
      (p) => `New message from ${s(p.sender_name)}`,
      (p) => `${s(p.sender_name)}: ${s(p.preview)}`,
    ),
    fr: c(
      (p) => `Nouveau message de ${s(p.sender_name)}`,
      (p) => `${s(p.sender_name)} : ${s(p.preview)}`,
    ),
    ar: c(
      (p) => `رسالة جديدة من ${s(p.sender_name)}`,
      (p) => `${s(p.sender_name)}: ${s(p.preview)}`,
    ),
  },
  support_reply: {
    en: c(
      () => 'New reply from ChantierOS support',
      (p) => s(p.preview),
    ),
    fr: c(
      () => 'Nouvelle réponse du support ChantierOS',
      (p) => s(p.preview),
    ),
    ar: c(
      () => 'رد جديد من دعم ChantierOS',
      (p) => s(p.preview),
    ),
  },
  task_assigned: {
    en: c(
      (p) => `New task: ${s(p.task_title)}`,
      (p) =>
        `You have been assigned "${s(p.task_title)}" (${s(p.project_name)}).`,
    ),
    fr: c(
      (p) => `Nouvelle tâche : ${s(p.task_title)}`,
      (p) => `Vous avez reçu « ${s(p.task_title)} » (${s(p.project_name)}).`,
    ),
    ar: c(
      (p) => `مهمة جديدة: ${s(p.task_title)}`,
      (p) => `تم تكليفك بـ "${s(p.task_title)}" (${s(p.project_name)}).`,
    ),
  },
  task_starting: {
    en: c(
      (p) => `Task starts tomorrow: ${s(p.task_title)}`,
      (p) =>
        `"${s(p.task_title)}" (${s(p.project_name)}) starts on ${s(p.start_date)}.`,
    ),
    fr: c(
      (p) => `Tâche demain : ${s(p.task_title)}`,
      (p) =>
        `« ${s(p.task_title)} » (${s(p.project_name)}) commence le ${s(p.start_date)}.`,
    ),
    ar: c(
      (p) => `مهمة تبدأ غدا: ${s(p.task_title)}`,
      (p) =>
        `"${s(p.task_title)}" (${s(p.project_name)}) تبدأ في ${s(p.start_date)}.`,
    ),
  },
  task_status_changed: {
    en: c(
      (p) => `Task updated: ${s(p.task_title)}`,
      (p) => `"${s(p.task_title)}" is now ${s(p.status)}.`,
    ),
    fr: c(
      (p) => `Tâche mise à jour : ${s(p.task_title)}`,
      (p) => `« ${s(p.task_title)} » est maintenant ${s(p.status)}.`,
    ),
    ar: c(
      (p) => `تم تحديث المهمة: ${s(p.task_title)}`,
      (p) => `"${s(p.task_title)}" أصبحت ${s(p.status)}.`,
    ),
  },
  end_of_day_reminder: {
    en: c(
      () => 'Log your hours for today',
      () =>
        'You have not logged any hours today. Please do it before you leave.',
    ),
    fr: c(
      () => "Déclarez vos heures d'aujourd'hui",
      () =>
        "Vous n'avez déclaré aucune heure aujourd'hui. Faites-le avant de partir.",
    ),
    ar: c(
      () => 'سجل ساعات عملك اليوم',
      () => 'لم تسجل أي ساعات اليوم. يرجى القيام بذلك قبل المغادرة.',
    ),
  },
  subscription_payment_failed: {
    en: c(
      () => 'Your subscription payment failed',
      (p) =>
        `We could not charge your card for ${s(p.amount)}. Your account still works, but please update your payment details before the next renewal.`,
    ),
    fr: c(
      () => 'Le paiement de votre abonnement a échoué',
      (p) =>
        `Nous n'avons pas pu prélever ${s(p.amount)}. Votre compte reste actif, mais merci de mettre à jour vos informations de paiement avant le prochain renouvellement.`,
    ),
    ar: c(
      () => 'فشل دفع اشتراكك',
      (p) =>
        `لم نتمكن من تحصيل ${s(p.amount)}. حسابك لا يزال يعمل، يرجى تحديث بيانات الدفع قبل التجديد القادم.`,
    ),
  },
  subscription_renewal_upcoming: {
    en: c(
      () => 'Your subscription renews soon',
      (p) =>
        `Your next charge of ${s(p.amount_due)} is coming up on ${s(p.period_end)}.`,
    ),
    fr: c(
      () => 'Votre abonnement se renouvelle bientôt',
      (p) =>
        `Votre prochain prélèvement de ${s(p.amount_due)} aura lieu le ${s(p.period_end)}.`,
    ),
    ar: c(
      () => 'سيتجدد اشتراكك قريبا',
      (p) => `الدفعة القادمة بقيمة ${s(p.amount_due)} في ${s(p.period_end)}.`,
    ),
  },
  tenant_signed_up: {
    en: c(
      (p) => `New company: ${s(p.company_name)}`,
      (p) => `${s(p.company_name)} just completed its registration.`,
    ),
  },
  payment_received: {
    en: c(
      (p) => `Payment received: ${s(p.company_name)}`,
      (p) => `${s(p.company_name)} paid ${s(p.amount)}.`,
    ),
  },
  payment_failed: {
    en: c(
      (p) => `Payment failed: ${s(p.company_name)}`,
      (p) => `The payment of ${s(p.amount)} from ${s(p.company_name)} failed.`,
    ),
  },
  tenant_status_changed: {
    en: c(
      (p) => `Company ${s(p.status)}: ${s(p.company_name)}`,
      (p) => `${s(p.company_name)} is now ${s(p.status)}.`,
    ),
  },
  support_ticket_opened: {
    en: c(
      (p) => `Support ticket: ${s(p.company_name)}`,
      (p) => `${s(p.company_name)} opened a ticket: ${s(p.subject)}.`,
    ),
  },
  usage_spike: {
    en: c(
      (p) => `Usage spike: ${s(p.company_name)}`,
      (p) => `${s(p.company_name)} went over the threshold for ${s(p.metric)}.`,
    ),
  },
  client_quote_sent: {
    en: c(
      (p) => `${s(p.company_name)} sent you a quote`,
      (p) => `Please review quote ${s(p.quote_ref)}.${link(p)}`,
    ),
    fr: c(
      (p) => `${s(p.company_name)} vous a envoyé un devis`,
      (p) => `Merci de consulter le devis ${s(p.quote_ref)} .${link(p)}`,
    ),
    ar: c(
      (p) => `أرسلت ${s(p.company_name)} عرض سعر إليك`,
      (p) => `يرجى مراجعة عرض السعر ${s(p.quote_ref)}.${link(p)}`,
    ),
  },
  client_invoice_sent: {
    en: c(
      (p) => `Invoice ${s(p.invoice_ref)} from ${s(p.company_name)}`,
      (p) => `Please pay invoice ${s(p.invoice_ref)} (${s(p.amount)}).`,
    ),
    fr: c(
      (p) => `Facture ${s(p.invoice_ref)} de ${s(p.company_name)}`,
      (p) => `Merci de régler la facture ${s(p.invoice_ref)} (${s(p.amount)}).`,
    ),
    ar: c(
      (p) => `فاتورة ${s(p.invoice_ref)} من ${s(p.company_name)}`,
      (p) => `يرجى دفع الفاتورة ${s(p.invoice_ref)} (${s(p.amount)}).`,
    ),
  },
  client_invoice_late: {
    en: c(
      (p) => `Reminder: invoice ${s(p.invoice_ref)} is overdue`,
      (p) =>
        `Invoice ${s(p.invoice_ref)} from ${s(p.company_name)} is still unpaid. Balance due: ${s(p.balance_due)}.`,
    ),
    fr: c(
      (p) => `Rappel : la facture ${s(p.invoice_ref)} est en retard`,
      (p) =>
        `La facture ${s(p.invoice_ref)} de ${s(p.company_name)} n'est toujours pas réglée. Solde dû : ${s(p.balance_due)}.`,
    ),
    ar: c(
      (p) => `تذكير: الفاتورة ${s(p.invoice_ref)} متأخرة`,
      (p) =>
        `الفاتورة ${s(p.invoice_ref)} من ${s(p.company_name)} لم تُدفع بعد. الرصيد المستحق: ${s(p.balance_due)}.`,
    ),
  },
  client_portal_message: {
    en: c(
      (p) => `New message from ${s(p.company_name)}`,
      (p) => `${s(p.preview)}${link(p)}`,
    ),
    fr: c(
      (p) => `Nouveau message de ${s(p.company_name)}`,
      (p) => `${s(p.preview)}${link(p)}`,
    ),
    ar: c(
      (p) => `رسالة جديدة من ${s(p.company_name)}`,
      (p) => `${s(p.preview)}${link(p)}`,
    ),
  },
};

export interface RenderedNotification {
  subject: string;
  body: string;
  html: string;
}

export function renderNotification(
  type: NotificationType,
  payload: Payload | null | undefined,
  locale: string | null | undefined,
): RenderedNotification {
  const copies: Partial<Record<string, Copy>> = TEMPLATES[type];
  const copy = (locale ? copies[locale] : undefined) ?? TEMPLATES[type].en;
  const { subject, body } = copy(payload ?? {});
  return {
    subject,
    body,
    html: `<p><strong>${subject}</strong></p><p>${body}</p>`,
  };
}
