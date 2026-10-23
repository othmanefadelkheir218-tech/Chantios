import { ModuleRef } from '@nestjs/core';
import Stripe from 'stripe';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { invoiceReceipt } from '../helpers/invoice-receipt.helper';
import { HandleInvoicePaidHandler } from './handle-invoice-paid.handler';

const T = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

/** A cycle invoice: next month's plan (10 €) + last month's overage (4 €). */
const paidInvoice = (over: Record<string, unknown> = {}) =>
  ({
    id: 'in_1',
    customer: 'cus_1',
    number: 'ABC-0002',
    amount_paid: 1400,
    total: 1400,
    total_excluding_tax: 1400,
    created: T('2026-11-01T10:00:00Z'),
    status_transitions: { paid_at: T('2026-11-01T11:00:00Z') },
    period_start: T('2026-10-01T00:00:00Z'),
    period_end: T('2026-11-01T00:00:00Z'),
    lines: {
      data: [
        {
          amount: 1000,
          parent: { type: 'subscription_item_details' },
          period: {
            start: T('2026-11-01T00:00:00Z'),
            end: T('2026-12-01T00:00:00Z'),
          },
        },
        {
          amount: 400,
          parent: { type: 'invoice_item_details' },
          period: {
            start: T('2026-11-01T00:00:00Z'),
            end: T('2026-11-01T00:00:00Z'),
          },
        },
      ],
    },
    ...over,
  }) as unknown as Stripe.Invoice;

describe('invoiceReceipt', () => {
  it('splits plan and overage, with the period of each, and the total paid', () => {
    expect(invoiceReceipt(paidInvoice())).toEqual({
      invoice_number: 'ABC-0002',
      paid_at: '2026-11-01',
      plan_amount: '10.00',
      period_start: '2026-11-01',
      period_end: '2026-12-01',
      extra_amount: '4.00',
      extra_period_start: '2026-10-01',
      extra_period_end: '2026-11-01',
      subtotal: '14.00',
      tax_amount: '0.00',
      tax_rate: null,
      reverse_charge: false,
      total: '14.00',
    });
  });

  it('no overage line: no extra period; HT / TVA 21 % / TTC from Stripe (step 27)', () => {
    const out = invoiceReceipt(
      paidInvoice({
        amount_paid: 1210,
        total: 1210,
        total_excluding_tax: 1000,
        total_taxes: [
          { amount: 210, tax_rate_details: { tax_rate: 'txr_be' } },
        ],
        lines: { data: [paidInvoice().lines.data[0]] },
      }),
      new Map([['txr_be', { percentage: '21.00', reverseCharge: false }]]),
    );
    expect(out.extra_amount).toBe('0.00');
    expect(out.extra_period_start).toBeNull();
    expect(out.subtotal).toBe('10.00');
    expect(out.tax_amount).toBe('2.10');
    expect(out.tax_rate).toBe('21.00');
    expect(out.reverse_charge).toBe(false);
    expect(out.total).toBe('12.10');
  });
});

describe('HandleInvoicePaidHandler', () => {
  const logger = { info: jest.fn(), warn: jest.fn() };
  const subscriptions = { findByStripeCustomerId: jest.fn() };
  const tenants = { findOne: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const plans = { findOne: jest.fn() };
  const moduleRef = { get: jest.fn(() => plans) };
  const handler = new HandleInvoicePaidHandler(
    logger as never,
    subscriptions as unknown as SubscriptionsService,
    tenants as unknown as TenantsService,
    notifications as unknown as NotificationsService,
    moduleRef as unknown as ModuleRef,
    { execute: () => Promise.resolve(new Map()) } as never,
  );
  const event = (invoice: Stripe.Invoice) =>
    ({
      id: 'evt_1',
      type: 'invoice.paid',
      data: { object: invoice },
    }) as unknown as Stripe.Event;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptions.findByStripeCustomerId.mockResolvedValue({
      tenantId: 7,
      planId: 3,
    });
    tenants.findOne.mockResolvedValue({ id: 7, locale: 'fr' });
    plans.findOne.mockResolvedValue({ id: 3, name: 'Pro' });
  });

  it('sends the receipt to the company, with the plan name and the billing page', async () => {
    await handler.execute(event(paidInvoice()));
    const [type, context] = notifications.dispatch.mock.calls[0] as [
      string,
      { tenantId: number; payload: Record<string, string> },
    ];
    expect(type).toBe('subscription_payment_received');
    expect(context.tenantId).toBe(7);
    expect(context.payload).toMatchObject({
      plan_name: 'Pro',
      plan_amount: '10.00',
      extra_amount: '4.00',
      total: '14.00',
    });
    expect(context.payload.billing_url).toMatch(/\/fr\/settings\/billing$/);
  });

  it('an invoice of 0 € (the trial) sends nothing', async () => {
    await handler.execute(event(paidInvoice({ amount_paid: 0 })));
    expect(notifications.dispatch).not.toHaveBeenCalled();
  });

  it('an unknown Stripe customer is logged and ignored', async () => {
    subscriptions.findByStripeCustomerId.mockResolvedValue(null);
    await handler.execute(event(paidInvoice()));
    expect(notifications.dispatch).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
