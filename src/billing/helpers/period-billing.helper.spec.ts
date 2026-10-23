import { InvoiceSummary } from '../../stripe/dto/invoice-summary.dto';
import { periodBilling } from './period-billing.helper';

// Step 27: a Belgian company, TVA 21 % on every line.
const be = (amount: number) => ({
  amount,
  tax: Math.round(amount * 0.21),
  taxRate: '21.00',
  reverseCharge: false,
});

// The three real invoices of a test company (Stripe test clock, 2026).
const OCT_16 = 1792159567; // 16/10 14:06:07 UTC
const NOV_16 = 1794837967;
const DEC_16 = 1797429967;
const at = (seconds: number) => new Date(seconds * 1000);

const invoices: InvoiceSummary[] = [
  {
    id: 'in_dec',
    status: 'paid',
    periodStart: NOV_16,
    lines: [
      { ...be(400), kind: 'extra', periodStart: DEC_16 },
      { ...be(1000), kind: 'plan', periodStart: DEC_16 },
    ],
  },
  {
    id: 'in_nov',
    status: 'paid',
    periodStart: OCT_16,
    lines: [{ ...be(1000), kind: 'plan', periodStart: NOV_16 }],
  },
  {
    id: 'in_first',
    status: 'paid',
    periodStart: OCT_16,
    lines: [{ ...be(1000), kind: 'plan', periodStart: OCT_16 }],
  },
];

describe('periodBilling — what Stripe charged for one period', () => {
  it('adds the plan (start of month) and the overage (end of month): 10 + 4 = 14 HT, 2,94 TVA, 16,94 paid', () => {
    expect(periodBilling(at(NOV_16), invoices)).toEqual({
      planAmount: '10.00',
      extraAmount: '4.00',
      subtotal: '14.00',
      taxAmount: '2.94',
      taxRate: '21.00',
      reverseCharge: false,
      total: '16.94',
      status: 'paid',
      invoiceIds: ['in_dec', 'in_nov'],
    });
  });

  it('a month with no overage = the plan only', () => {
    const result = periodBilling(at(OCT_16), invoices);
    expect(result.total).toBe('12.10');
    expect(result.subtotal).toBe('10.00');
    expect(result.extraAmount).toBe('0.00');
    expect(result.invoiceIds).toEqual(['in_first']);
  });

  it('the trial (before the first card payment) = nothing charged', () => {
    const trialStart = OCT_16 - 14 * 24 * 3600;
    expect(periodBilling(at(trialStart), invoices)).toMatchObject({
      total: '0.00',
      status: 'none',
      invoiceIds: [],
    });
  });

  it('an unpaid invoice makes the period due', () => {
    const open = invoices.map((i) =>
      i.id === 'in_dec' ? { ...i, status: 'open' } : i,
    );
    expect(periodBilling(at(NOV_16), open).status).toBe('due');
  });

  it('the rate changed between the two invoices → amount without a single rate', () => {
    const mixed = invoices.map((i) =>
      i.id === 'in_dec'
        ? {
            ...i,
            lines: i.lines.map((l) =>
              l.kind === 'extra' ? { ...l, tax: 88, taxRate: '22.00' } : l,
            ),
          }
        : i,
    );
    const result = periodBilling(at(NOV_16), mixed);
    expect(result.taxRate).toBeNull();
    expect(result.taxAmount).toBe('2.98');
  });

  it('reverse charge: TVA 0 %, total = HT', () => {
    const rc = invoices.map((i) => ({
      ...i,
      lines: i.lines.map((l) => ({
        ...l,
        tax: 0,
        taxRate: '0.00',
        reverseCharge: true,
      })),
    }));
    expect(periodBilling(at(NOV_16), rc)).toMatchObject({
      subtotal: '14.00',
      taxAmount: '0.00',
      taxRate: '0.00',
      reverseCharge: true,
      total: '14.00',
    });
  });

  it('an old invoice with no TVA → no rate, total = HT', () => {
    const old = invoices.map((i) => ({
      ...i,
      lines: i.lines.map((l) => ({
        ...l,
        tax: 0,
        taxRate: null,
        reverseCharge: false,
      })),
    }));
    expect(periodBilling(at(NOV_16), old)).toMatchObject({
      taxRate: null,
      reverseCharge: false,
      total: '14.00',
    });
  });
});
