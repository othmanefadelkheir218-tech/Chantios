import { renderNotification } from '../../notifications/helpers/notification-templates.helper';
import {
  formatEmailDate,
  formatEmailMoney,
  formatEmailPayload,
} from './email-format.helper';

describe('email money and dates', () => {
  it('money: fr and nl `10,00 €`, en `€10.00`, thousands spaced', () => {
    expect(formatEmailMoney('10.00', 'fr')).toBe('10,00 €');
    expect(formatEmailMoney('1234.5', 'nl')).toBe('1 234,50 €');
    expect(formatEmailMoney('10', 'en')).toBe('€10.00');
  });

  it('dates: dd/mm/yyyy in every language', () => {
    expect(formatEmailDate('2026-12-30')).toBe('30/12/2026');
    expect(formatEmailDate('2026-12-30T08:00:00.000Z')).toBe('30/12/2026');
  });

  it('anything that is not a plain amount or date is left as it is', () => {
    expect(formatEmailMoney('10,00 €', 'fr')).toBe('10,00 €');
    expect(formatEmailDate('soon')).toBe('soon');
    expect(formatEmailPayload({ project_name: '2026-01-01' }, 'fr')).toEqual({
      project_name: '2026-01-01',
    });
  });

  it('the company emails show formatted money and dates', () => {
    const out = renderNotification(
      'subscription_renewal_upcoming',
      { amount_due: '10.00', period_end: '2026-12-30' },
      'fr',
    );
    expect(out.html).toContain('10,00 €');
    expect(out.html).toContain('30/12/2026');
    expect(out.html).not.toContain('2026-12-30');
  });
});

describe('payment received email', () => {
  const payload = {
    invoice_number: 'ABC-0002',
    paid_at: '2026-11-01',
    plan_name: 'Pro',
    plan_amount: '10.00',
    period_start: '2026-11-01',
    period_end: '2026-12-01',
    extra_amount: '4.00',
    extra_period_start: '2026-10-01',
    extra_period_end: '2026-11-01',
    tax_amount: '0.00',
    total: '14.00',
    billing_url: 'https://app.test/fr/settings/billing',
  };

  it('fr: plan with its period, extra with its month, total, button to the billing page', () => {
    const out = renderNotification(
      'subscription_payment_received',
      payload,
      'fr',
    );
    expect(out.subject).toBe('Paiement reçu — merci');
    expect(out.html).toContain('Formule');
    expect(out.html).toContain('<strong>Pro</strong>');
    expect(out.html).toContain('Du 01/11/2026 au 01/12/2026');
    expect(out.html).toContain('Supplément HT (dépassement)');
    expect(out.html).toContain('4,00 €');
    expect(out.html).toContain('Total payé');
    expect(out.html).toContain('14,00 €');
    expect(out.html).toContain('Voir mon abonnement');
    expect(out.html).toContain('ABC-0002');
    // VAT 0 → no VAT row
    expect(out.html).not.toContain('TVA');
  });

  it('fr, TVA 21 % (step 27): Total HT, TVA with its rate, total paid TTC', () => {
    const out = renderNotification(
      'subscription_payment_received',
      {
        ...payload,
        subtotal: '14.00',
        tax_amount: '2.94',
        tax_rate: '21.00',
        reverse_charge: false,
        total: '16.94',
      },
      'fr',
    );
    expect(out.html).toContain('Total HT');
    expect(out.html).toContain('TVA 21 %');
    expect(out.html).toContain('2,94 €');
    expect(out.html).toContain('Total payé (TTC)');
    expect(out.html).toContain('16,94 €');
  });

  it('en, reverse charge (step 27): VAT 0 % row even with no amount', () => {
    const out = renderNotification(
      'subscription_payment_received',
      {
        ...payload,
        subtotal: '14.00',
        tax_amount: '0.00',
        tax_rate: '0.00',
        reverse_charge: true,
      },
      'en',
    );
    expect(out.html).toContain('VAT 0 % — reverse charge');
    expect(out.html).toContain('Total excl. VAT');
  });

  it('upcoming charge (step 27): TTC with HT + TVA in the text', () => {
    const out = renderNotification(
      'subscription_renewal_upcoming',
      {
        amount_due: '12.10',
        subtotal: '10.00',
        tax_amount: '2.10',
        tax_rate: '21.00',
        reverse_charge: false,
        total: '12.10',
        period_end: '2026-12-01',
      },
      'fr',
    );
    expect(out.html).toContain('12,10 € TTC (10,00 € HT + TVA 21 % 2,10 €)');
  });

  it('payment failed (step 27): the amount says VAT included', () => {
    const out = renderNotification(
      'subscription_payment_failed',
      { amount: '12.10' },
      'fr',
    );
    expect(out.html).toContain('12,10 € (TVA comprise)');
  });

  it('no overage: no extra row', () => {
    const out = renderNotification(
      'subscription_payment_received',
      { ...payload, extra_amount: '0.00', total: '10.00' },
      'nl',
    );
    expect(out.html).not.toContain('Extra gebruik');
    expect(out.html).toContain('Totaal betaald');
  });

  it('an unknown language falls back to English', () => {
    const out = renderNotification(
      'subscription_payment_received',
      payload,
      'de',
    );
    expect(out.subject).toBe('Payment received — thank you');
    expect(out.html).toContain('€14.00');
  });
});
