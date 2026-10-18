import { formatEmailPayload } from '../../email/helpers/email-format.helper';
import {
  EMAIL_LINK_COLOR,
  renderEmailLayout,
  renderEmailSummary,
  toEmailLocale,
} from '../../email/templates/email-layout';
import { EmailLocale } from '../../email/templates/invite-employee.template';
import { NotificationType } from '../notification.types';

type Payload = Record<string, unknown>;
/**
 * `detailsHtml` (email only): an extra block under the text, e.g. the
 * payment summary. `button`: the orange button when there is no portal link.
 */
type Copy = (p: Payload) => {
  subject: string;
  body: string;
  detailsHtml?: string;
  button?: { label: string; url: string };
};
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
  return url
    ? `<br><a href="${url}" style="color:${EMAIL_LINK_COLOR};font-weight:bold;">${url}</a>`
    : '';
}

const c =
  (subject: (p: Payload) => string, body: (p: Payload) => string): Copy =>
  (p) => ({ subject: subject(p), body: body(p) });

type ReceiptWords = {
  subject: string;
  intro: (p: Payload) => string;
  plan: string;
  extra: string;
  tax: string;
  total: string;
  period: (from: string, to: string) => string;
  invoice: string;
  button: string;
};

/** A formatted amount that is not zero (`0,00 €` / `€0.00` = no row). */
const hasAmount = (value: unknown) =>
  typeof value === 'string' &&
  value !== '' &&
  !/^\D*0([.,]00)?\D*$/.test(value);

/**
 * `subscription_payment_received`: the text, then a receipt box — plan (with
 * its period), extra usage (with the month it covers), VAT, total — and a
 * button to the billing page. Values arrive formatted (`formatEmailPayload`).
 */
const receipt =
  (w: ReceiptWords): Copy =>
  (p) => {
    const rows = [];
    if (hasAmount(p.plan_amount)) {
      rows.push({
        label: `${w.plan}${p.plan_name ? ` · <strong>${s(p.plan_name)}</strong>` : ''}`,
        value: s(p.plan_amount),
        ...(p.period_start && p.period_end
          ? { hint: w.period(s(p.period_start), s(p.period_end)) }
          : {}),
      });
    }
    if (hasAmount(p.extra_amount)) {
      rows.push({
        label: w.extra,
        value: s(p.extra_amount),
        ...(p.extra_period_start && p.extra_period_end
          ? { hint: w.period(s(p.extra_period_start), s(p.extra_period_end)) }
          : {}),
      });
    }
    if (hasAmount(p.tax_amount)) {
      rows.push({ label: w.tax, value: s(p.tax_amount) });
    }
    const invoiceLine = p.invoice_number
      ? `<p style="margin:16px 0 0;font-size:13px;color:#64748B;">${w.invoice} ${s(p.invoice_number)}</p>`
      : '';
    return {
      subject: w.subject,
      body: w.intro(p),
      detailsHtml:
        renderEmailSummary(rows, { label: w.total, value: s(p.total) }) +
        invoiceLine,
      ...(p.billing_url
        ? { button: { label: w.button, url: s(p.billing_url) } }
        : {}),
    };
  };

/**
 * Subject + body for every alert, per locale (`fr`, `en`, `nl`; a missing or
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
    nl: c(
      (p) => `Lage voorraad: ${s(p.material_name)}`,
      (p) =>
        `${s(p.material_name)} staat op ${s(p.on_hand)} ${s(p.unit)}, op of onder het minimum. Tijd om te bestellen.`,
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
    nl: c(
      (p) => `Reservering niet gedekt: ${s(p.material_name)}`,
      (p) =>
        `De reserveringen voor ${s(p.material_name)} zijn hoger dan de voorraad (tekort van ${s(p.short_by)}). Bestel meer.`,
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
    nl: c(
      (p) => `Budgetwaarschuwing: ${s(p.project_name)}`,
      (p) =>
        `Dit project nadert zijn budgetlimiet (${s(p.cost_pct)} % van het budget is uitgegeven): ${s(p.project_name)}.`,
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
    nl: c(
      (p) => `Budget kritiek: ${s(p.project_name)}`,
      (p) =>
        `Dit project overschrijdt zijn budget — onmiddellijke controle nodig (${s(p.cost_pct)} % uitgegeven): ${s(p.project_name)}.`,
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
    nl: c(
      (p) => `Factuur ${s(p.invoice_ref)} te laat`,
      (p) =>
        `Factuur ${s(p.invoice_ref)} is over de vervaldatum. Openstaand saldo: ${s(p.balance_due)}.`,
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
    nl: c(
      (p) => `Factuur ${s(p.invoice_ref)} betaald`,
      (p) =>
        `Factuur ${s(p.invoice_ref)} is volledig betaald (${s(p.amount)}).`,
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
    nl: c(
      (p) => `Leveranciersfactuur te betalen: ${s(p.invoice_ref)}`,
      (p) =>
        `Factuur ${s(p.invoice_ref)} vervalt op ${s(p.due_date)}. Betaal ze binnenkort.`,
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
    nl: c(
      (p) => `Abnormale uren: ${s(p.employee_name)}`,
      (p) =>
        `${s(p.employee_name)} registreerde ${s(p.hours)} u op ${s(p.date)} over alle projecten heen (meer dan 12 u).`,
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
    nl: c(
      (p) => `Ontbrekend urenblad: ${s(p.employee_name)}`,
      (p) =>
        `${s(p.employee_name)} heeft vandaag een taak in uitvoering maar geen uren geregistreerd.`,
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
    nl: c(
      (p) => `Project ligt stil: ${s(p.project_name)}`,
      (p) =>
        `Er zijn al ${s(p.days)} dagen geen uren geregistreerd op ${s(p.project_name)}.`,
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
    nl: c(
      (p) => `Ontbrekend werfverslag: ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} is bezig zonder werfverslag sinds ${s(p.days)} dagen.`,
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
    nl: c(
      (p) => `Voortgang stilgevallen: ${s(p.project_name)}`,
      (p) =>
        `De voortgang van ${s(p.project_name)} is al ${s(p.days)} dagen niet gewijzigd.`,
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
    nl: c(
      (p) => `Project geannuleerd: ${s(p.project_name)}`,
      (p) =>
        `${s(p.project_name)} werd geannuleerd. Vergeet de klant niet te factureren voor het reeds uitgevoerde werk.`,
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
    nl: c(
      (p) => `Nieuw bericht van ${s(p.sender_name)}`,
      (p) => `${s(p.sender_name)}: ${s(p.preview)}`,
    ),
  },
  support_reply: {
    en: c(
      () => 'New reply from ChantiOs support',
      (p) => s(p.preview),
    ),
    fr: c(
      () => 'Nouvelle réponse du support ChantiOs',
      (p) => s(p.preview),
    ),
    nl: c(
      () => 'Nieuw antwoord van de ChantiOs-support',
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
    nl: c(
      (p) => `Nieuwe taak: ${s(p.task_title)}`,
      (p) => `U kreeg "${s(p.task_title)}" toegewezen (${s(p.project_name)}).`,
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
    nl: c(
      (p) => `Taak start morgen: ${s(p.task_title)}`,
      (p) =>
        `"${s(p.task_title)}" (${s(p.project_name)}) start op ${s(p.start_date)}.`,
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
    nl: c(
      (p) => `Taak bijgewerkt: ${s(p.task_title)}`,
      (p) => `"${s(p.task_title)}" is nu ${s(p.status)}.`,
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
    nl: c(
      () => 'Registreer uw uren van vandaag',
      () =>
        'U hebt vandaag nog geen uren geregistreerd. Doe dit voordat u vertrekt.',
    ),
  },
  subscription_payment_failed: {
    en: c(
      () => 'Your subscription payment failed',
      (p) =>
        p.grace_ends_at
          ? `We could not charge ${s(p.amount)}. Please pay before ${s(p.grace_ends_at)} on the billing page, or your company will be blocked.`
          : `We could not charge ${s(p.amount)}. Your company stays blocked until the subscription is paid.`,
    ),
    fr: c(
      () => 'Le paiement de votre abonnement a échoué',
      (p) =>
        p.grace_ends_at
          ? `Nous n'avons pas pu prélever ${s(p.amount)}. Merci de payer avant le ${s(p.grace_ends_at)} sur la page Abonnement, sinon votre entreprise sera bloquée.`
          : `Nous n'avons pas pu prélever ${s(p.amount)}. Votre entreprise reste bloquée jusqu'au paiement de l'abonnement.`,
    ),
    nl: c(
      () => 'De betaling van uw abonnement is mislukt',
      (p) =>
        p.grace_ends_at
          ? `We konden ${s(p.amount)} niet afschrijven. Betaal vóór ${s(p.grace_ends_at)} op de abonnementspagina, anders wordt uw bedrijf geblokkeerd.`
          : `We konden ${s(p.amount)} niet afschrijven. Uw bedrijf blijft geblokkeerd tot het abonnement betaald is.`,
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
    nl: c(
      () => 'Uw abonnement wordt binnenkort verlengd',
      (p) =>
        `Uw volgende afschrijving van ${s(p.amount_due)} gebeurt op ${s(p.period_end)}.`,
    ),
  },
  trial_ending: {
    en: c(
      () => 'Your free trial ends in 3 days',
      (p) =>
        `Your ChantiOs trial ends on ${s(p.trial_end)}. Add a payment method on the billing page to keep using the app without a break.`,
    ),
    fr: c(
      () => 'Votre essai gratuit se termine dans 3 jours',
      (p) =>
        `Votre essai ChantiOs se termine le ${s(p.trial_end)}. Ajoutez un moyen de paiement sur la page Abonnement pour continuer sans interruption.`,
    ),
    nl: c(
      () => 'Uw gratis proefperiode eindigt over 3 dagen',
      (p) =>
        `Uw ChantiOs-proefperiode eindigt op ${s(p.trial_end)}. Voeg een betaalmethode toe op de abonnementspagina om zonder onderbreking verder te werken.`,
    ),
  },
  trial_ended: {
    en: c(
      () => 'Your free trial has ended',
      (p) =>
        `Your trial is over. The app keeps working until ${s(p.grace_ends_at)}: add a payment method before that date, or your company will be blocked.`,
    ),
    fr: c(
      () => 'Votre essai gratuit est terminé',
      (p) =>
        `Votre essai est terminé. L'application reste ouverte jusqu'au ${s(p.grace_ends_at)} : ajoutez un moyen de paiement avant cette date, sinon votre entreprise sera bloquée.`,
    ),
    nl: c(
      () => 'Uw gratis proefperiode is afgelopen',
      (p) =>
        `Uw proefperiode is voorbij. De app blijft werken tot ${s(p.grace_ends_at)}: voeg vóór die datum een betaalmethode toe, anders wordt uw bedrijf geblokkeerd.`,
    ),
  },
  subscription_blocked: {
    en: c(
      () => 'Your company is blocked',
      () =>
        'No payment was received, so your company is blocked. Your data is kept. Log in and open the billing page to subscribe and open everything again.',
    ),
    fr: c(
      () => 'Votre entreprise est bloquée',
      () =>
        "Aucun paiement n'a été reçu : votre entreprise est bloquée. Vos données sont conservées. Connectez-vous et ouvrez la page Abonnement pour vous abonner et tout rouvrir.",
    ),
    nl: c(
      () => 'Uw bedrijf is geblokkeerd',
      () =>
        'Er is geen betaling ontvangen, dus uw bedrijf is geblokkeerd. Uw gegevens blijven bewaard. Log in en open de abonnementspagina om u te abonneren en alles weer te openen.',
    ),
  },
  import_done: {
    en: c(
      (p) => `Import finished: ${s(p.file_name)}`,
      (p) =>
        `Your file "${s(p.file_name)}" was imported: ${s(p.created_count)} created, ${s(p.updated_count)} updated.`,
    ),
    fr: c(
      (p) => `Import terminé : ${s(p.file_name)}`,
      (p) =>
        `Votre fichier « ${s(p.file_name)} » est importé : ${s(p.created_count)} créé(s), ${s(p.updated_count)} mis à jour.`,
    ),
    nl: c(
      (p) => `Import klaar: ${s(p.file_name)}`,
      (p) =>
        `Uw bestand "${s(p.file_name)}" is geïmporteerd: ${s(p.created_count)} aangemaakt, ${s(p.updated_count)} bijgewerkt.`,
    ),
  },
  import_failed: {
    en: c(
      (p) => `Import failed: ${s(p.file_name)}`,
      (p) =>
        `Your file "${s(p.file_name)}" was not imported: ${s(p.error_count)} error(s). Nothing was saved. Open the import to see each line.`,
    ),
    fr: c(
      (p) => `Import échoué : ${s(p.file_name)}`,
      (p) =>
        `Votre fichier « ${s(p.file_name)} » n'est pas importé : ${s(p.error_count)} erreur(s). Rien n'a été enregistré. Ouvrez l'import pour voir chaque ligne.`,
    ),
    nl: c(
      (p) => `Import mislukt: ${s(p.file_name)}`,
      (p) =>
        `Uw bestand "${s(p.file_name)}" is niet geïmporteerd: ${s(p.error_count)} fout(en). Er is niets opgeslagen. Open de import om elke regel te zien.`,
    ),
  },
  subscription_payment_received: {
    en: receipt({
      subject: 'Payment received — thank you',
      intro: (p) =>
        `We received your payment of ${s(p.total)} on ${s(p.paid_at)}. Here is the detail.`,
      plan: 'Plan',
      extra: 'Extra usage',
      tax: 'VAT',
      total: 'Total paid',
      period: (from, to) => `From ${from} to ${to}`,
      invoice: 'Invoice',
      button: 'View my subscription',
    }),
    fr: receipt({
      subject: 'Paiement reçu — merci',
      intro: (p) =>
        `Nous avons bien reçu votre paiement de ${s(p.total)} le ${s(p.paid_at)}. Voici le détail.`,
      plan: 'Formule',
      extra: 'Supplément (dépassement)',
      tax: 'TVA',
      total: 'Total payé',
      period: (from, to) => `Du ${from} au ${to}`,
      invoice: 'Facture',
      button: 'Voir mon abonnement',
    }),
    nl: receipt({
      subject: 'Betaling ontvangen — bedankt',
      intro: (p) =>
        `We hebben uw betaling van ${s(p.total)} ontvangen op ${s(p.paid_at)}. Hier is het detail.`,
      plan: 'Formule',
      extra: 'Extra gebruik',
      tax: 'Btw',
      total: 'Totaal betaald',
      period: (from, to) => `Van ${from} tot ${to}`,
      invoice: 'Factuur',
      button: 'Mijn abonnement bekijken',
    }),
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
      (p) => `Merci de consulter le devis ${s(p.quote_ref)}.${link(p)}`,
    ),
    nl: c(
      (p) => `${s(p.company_name)} stuurde u een offerte`,
      (p) => `Bekijk offerte ${s(p.quote_ref)}.${link(p)}`,
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
    nl: c(
      (p) => `Factuur ${s(p.invoice_ref)} van ${s(p.company_name)}`,
      (p) => `Gelieve factuur ${s(p.invoice_ref)} (${s(p.amount)}) te betalen.`,
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
    nl: c(
      (p) => `Herinnering: factuur ${s(p.invoice_ref)} is vervallen`,
      (p) =>
        `Factuur ${s(p.invoice_ref)} van ${s(p.company_name)} is nog niet betaald. Openstaand saldo: ${s(p.balance_due)}.`,
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
    nl: c(
      (p) => `Nieuw bericht van ${s(p.company_name)}`,
      (p) => `${s(p.preview)}${link(p)}`,
    ),
  },
};

export interface RenderedNotification {
  subject: string;
  body: string;
  html: string;
}

const OPEN_BUTTON: Record<EmailLocale, string> = {
  fr: 'Ouvrir',
  en: 'Open',
  nl: 'Openen',
};

export function renderNotification(
  type: NotificationType,
  payload: Payload | null | undefined,
  locale: string | null | undefined,
): RenderedNotification {
  const copies: Partial<Record<string, Copy>> = TEMPLATES[type];
  const copy = (locale ? copies[locale] : undefined) ?? TEMPLATES[type].en;
  const emailLocale = toEmailLocale(locale);
  // Money and dates in the reader's language: `10,00 €`, `30/12/2026`.
  const data = formatEmailPayload(payload ?? {}, emailLocale);
  const { subject, body, detailsHtml, button } = copy(data);

  // In the email the portal link becomes the orange button; the in-app `body`
  // keeps the link inline.
  const portalLink = link(data);
  const portalUrl = s(data.portal_url);

  return {
    subject,
    body,
    html: renderEmailLayout({
      locale: emailLocale,
      title: subject,
      bodyHtml: `<p style="margin:0;">${portalLink ? body.replace(portalLink, '') : body}</p>${detailsHtml ?? ''}`,
      ...(portalUrl
        ? { button: { label: OPEN_BUTTON[emailLocale], url: portalUrl } }
        : button && { button }),
    }),
  };
}
