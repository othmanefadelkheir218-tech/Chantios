import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { callArg } from '../../common/testing/spec-helpers';
import type { CheckoutSessionInput } from '../../stripe/dto/checkout-session.dto';
import { SetPendingPlanHandler } from '../../subscriptions/handlers/set-pending-plan.handler';
import {
  checkoutTrialEnd,
  isRealStripeCustomer,
} from '../helpers/card-payment.helper';
import { CancelCardSubscriptionHandler } from './cancel-card-subscription.handler';
import { RunRenewalHandler } from './run-renewal.handler';
import { StartCheckoutHandler } from './start-checkout.handler';

/** Step 21 — paying by card: the billing side. */

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const row = (over: Record<string, unknown> = {}) => ({
  tenantId: 7,
  planId: 1,
  pendingPlanId: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  status: 'trialing',
  cancelAtPeriodEnd: false,
  periodStart: new Date('2026-10-01T00:00:00Z'),
  periodEnd: new Date('2026-10-30T00:00:00Z'),
  ...over,
});

describe('card-payment helper', () => {
  it('a trial keeps its free days (Q1)', () => {
    const now = new Date('2026-10-15T00:00:00Z');
    const end = new Date('2026-10-29T00:00:00Z');
    expect(checkoutTrialEnd(end, now)).toBe(end.getTime() / 1000);
  });

  it('less than 48 hours left → Stripe minimum', () => {
    const now = new Date('2026-10-15T00:00:00Z');
    const end = new Date('2026-10-16T00:00:00Z');
    expect(checkoutTrialEnd(end, now) * 1000).toBeGreaterThan(
      now.getTime() + 48 * 3600 * 1000,
    );
  });

  it('the dev tools fake customer is not a real one', () => {
    expect(isRealStripeCustomer('cus_dev_12')).toBe(false);
    expect(isRealStripeCustomer(null)).toBe(false);
    expect(isRealStripeCustomer('cus_RealOne')).toBe(true);
  });
});

describe('StartCheckoutHandler — the "Pay" button', () => {
  const subscriptions = {
    findByTenant: jest.fn(),
    clearStripeSubscription: jest.fn(),
    setStripeCustomerId: jest.fn(),
  };
  const plans = { findOne: jest.fn() };
  const tenants = {
    findOne: jest.fn().mockResolvedValue({ name: 'Acme', email: 'a@b.c' }),
  };
  const stripe = {
    findOpenInvoiceUrl: jest.fn(),
    endSubscriptionNow: jest.fn(),
    createCustomer: jest.fn().mockResolvedValue('cus_new'),
    createCheckoutSession: jest
      .fn()
      .mockResolvedValue('https://checkout.stripe.com/x'),
    syncSubscriptionTax: jest.fn(),
  };
  // Step 27: a Belgian company, TVA 21 %.
  const tenantVat = {
    withNumber: jest.fn(),
  };
  const domestic = {
    vat: {
      kind: 'domestic',
      country: 'BE',
      rate: '21.00',
      stripeTaxRateId: 'txr_be',
    },
    euVatNumber: 'BE0123456789',
  };
  const handler = new StartCheckoutHandler(
    logger as never,
    subscriptions as never,
    plans as never,
    tenants as never,
    stripe as never,
    tenantVat as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    plans.findOne.mockResolvedValue({ id: 1, stripePriceId: 'price_1' });
    tenantVat.withNumber.mockResolvedValue(domestic);
  });

  it.each([
    ['no_country', 'Fill in your company country first'],
    ['country_not_supported', 'Your country is not supported yet'],
  ])(
    'no TVA (%s) → 409, nothing in Stripe (step 27)',
    async (reason, message) => {
      tenantVat.withNumber.mockResolvedValue({
        vat: { kind: 'missing', reason },
        euVatNumber: null,
      });
      await expect(handler.execute(7, { locale: 'fr' })).rejects.toThrow(
        message,
      );
      expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
      expect(stripe.syncSubscriptionTax).not.toHaveBeenCalled();
    },
  );

  it('Checkout gets the TaxRate; the customer its TVA number first (step 27)', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({ stripeCustomerId: 'cus_1' }),
    );
    await handler.execute(7, { locale: 'fr' });
    expect(stripe.syncSubscriptionTax).toHaveBeenCalledWith({
      customerId: 'cus_1',
      subscriptionId: null,
      taxRateId: 'txr_be',
      reverseCharge: false,
      euVatNumber: 'BE0123456789',
    });
    expect(
      callArg<CheckoutSessionInput>(stripe.createCheckoutSession, 0, 0)
        .taxRateId,
    ).toBe('txr_be');
  });

  it('a trial company → new customer + Checkout with the trial end', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({ stripeCustomerId: 'cus_dev_7' }),
    );
    const result = await handler.execute(7, { locale: 'fr' });
    expect(result).toEqual({ url: 'https://checkout.stripe.com/x' });
    expect(stripe.createCustomer).toHaveBeenCalledWith(7, 'Acme', 'a@b.c');
    expect(subscriptions.setStripeCustomerId).toHaveBeenCalledWith(
      7,
      'cus_new',
    );
    const input = callArg<CheckoutSessionInput>(
      stripe.createCheckoutSession,
      0,
      0,
    );
    expect(input).toMatchObject({
      customerId: 'cus_new',
      priceId: 'price_1',
      locale: 'fr',
    });
    expect(input.trialEnd).toBeGreaterThan(0);
    expect(input.successUrl).toMatch(
      /\/fr\/settings\/billing\?checkout=success$/,
    );
  });

  it('a waiting plan change → pays that plan', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({ status: 'active', pendingPlanId: 3, stripeCustomerId: 'cus_1' }),
    );
    await handler.execute(7, { locale: 'en' });
    expect(plans.findOne).toHaveBeenCalledWith(3);
    expect(stripe.createCustomer).not.toHaveBeenCalled();
    expect(
      callArg<CheckoutSessionInput>(stripe.createCheckoutSession, 0, 0)
        .trialEnd,
    ).toBeUndefined();
  });

  it('past_due with a card subscription → the unpaid Stripe invoice', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({
        status: 'past_due',
        stripeSubscriptionId: 'sub_1',
        stripeCustomerId: 'cus_1',
      }),
    );
    stripe.findOpenInvoiceUrl.mockResolvedValue('https://invoice.stripe.com/i');
    expect(await handler.execute(7, { locale: 'fr' })).toEqual({
      url: 'https://invoice.stripe.com/i',
    });
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('blocked with an old card subscription → ended, then a new Checkout (Q8)', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({
        status: 'cancelled',
        stripeSubscriptionId: 'sub_old',
        stripeCustomerId: 'cus_1',
      }),
    );
    await handler.execute(7, { locale: 'nl' });
    expect(stripe.endSubscriptionNow).toHaveBeenCalledWith('sub_old');
    expect(subscriptions.clearStripeSubscription).toHaveBeenCalledWith(7);
    expect(stripe.createCheckoutSession).toHaveBeenCalled();
  });

  it('already paying by card → 409', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({ status: 'active', stripeSubscriptionId: 'sub_1' }),
    );
    await expect(handler.execute(7, { locale: 'fr' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('a plan with no Stripe price → 409', async () => {
    subscriptions.findByTenant.mockResolvedValue(row());
    plans.findOne.mockResolvedValue({ id: 1, stripePriceId: null });
    await expect(handler.execute(7, { locale: 'fr' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('CancelCardSubscriptionHandler — cancel / keep (Q6, Q6b)', () => {
  const subscriptions = {
    findByTenant: jest.fn(),
    syncStripeSubscription: jest.fn(),
  };
  const state = {
    stripeSubscriptionId: 'sub_1',
    periodEnd: new Date(),
    cancelAtPeriodEnd: true,
  };
  const stripe = { setCancelAtPeriodEnd: jest.fn().mockResolvedValue(state) };
  const handler = new CancelCardSubscriptionHandler(
    logger as never,
    subscriptions as never,
    stripe as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('cancel → Stripe at period end, state saved', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({ status: 'active', stripeSubscriptionId: 'sub_1' }),
    );
    await handler.execute(7, true);
    expect(stripe.setCancelAtPeriodEnd).toHaveBeenCalledWith('sub_1', true);
    expect(subscriptions.syncStripeSubscription).toHaveBeenCalledWith(7, state);
  });

  it('already in that state → no Stripe call', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({
        status: 'active',
        stripeSubscriptionId: 'sub_1',
        cancelAtPeriodEnd: true,
      }),
    );
    await handler.execute(7, true);
    expect(stripe.setCancelAtPeriodEnd).not.toHaveBeenCalled();
  });

  it('no card subscription, or blocked → 409', async () => {
    subscriptions.findByTenant.mockResolvedValue(row());
    await expect(handler.execute(7, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    subscriptions.findByTenant.mockResolvedValue(
      row({ status: 'cancelled', stripeSubscriptionId: 'sub_1' }),
    );
    await expect(handler.execute(7, false)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('RunRenewalHandler — card companies (Q2)', () => {
  const subscriptions = {
    findByTenant: jest.fn(),
    snapshotUsage: jest.fn(),
    setPeriod: jest.fn(),
    applyPendingPlan: jest.fn(),
  };
  const plans = {
    findOne: jest.fn().mockResolvedValue({
      features: [
        {
          featureKey: 'max_workers',
          limitValue: 2,
          overageRate: new Prisma.Decimal(2),
        },
      ],
    }),
  };
  const countUsage = {
    execute: jest.fn().mockResolvedValue({ max_workers: 3 }),
  };
  const applyPendingPlan = { execute: jest.fn() };
  const stripe = { pushOverageInvoiceItem: jest.fn() };
  const handler = new RunRenewalHandler(
    logger as never,
    subscriptions as never,
    plans as never,
    countUsage as never,
    applyPendingPlan as never,
    stripe as never,
    {} as never,
    {
      execute: () =>
        Promise.resolve({
          kind: 'domestic',
          rate: '21.00',
          stripeTaxRateId: 'txr_be',
        }),
    } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('the nightly job skips a card company', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({ status: 'active', stripeSubscriptionId: 'sub_1' }),
    );
    expect(await handler.execute(7)).toMatchObject({ skipped: true });
    expect(subscriptions.snapshotUsage).not.toHaveBeenCalled();
  });

  it('on the Stripe invoice → snapshot, overage onto that invoice, pending plan applied', async () => {
    subscriptions.findByTenant.mockResolvedValue(
      row({
        status: 'active',
        stripeSubscriptionId: 'sub_1',
        stripeCustomerId: 'cus_1',
        pendingPlanId: 3,
      }),
    );
    const periodStart = new Date('2026-09-15T00:00:00Z');
    const periodEnd = new Date('2026-10-15T00:00:00Z');
    const result = await handler.executeForStripeInvoice(7, {
      invoiceId: 'in_1',
      periodStart,
      periodEnd,
    });
    expect(result.totalOverage).toBe('2');
    expect(subscriptions.snapshotUsage).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 7, periodStart, periodEnd }),
    );
    expect(stripe.pushOverageInvoiceItem).toHaveBeenCalledWith(
      'cus_1',
      new Prisma.Decimal(2),
      expect.any(String),
      `overage:7:${periodStart.toISOString()}`,
      'in_1',
      'txr_be',
    );
    expect(subscriptions.applyPendingPlan).toHaveBeenCalledWith(7);
    expect(subscriptions.setPeriod).not.toHaveBeenCalled();
  });
});

describe('SetPendingPlanHandler — card companies (Q4)', () => {
  const repo = { findByTenant: jest.fn(), setPendingPlan: jest.fn() };
  const plans = { findOne: jest.fn() };
  const stripe = { updateSubscriptionPrice: jest.fn() };
  const handler = new SetPendingPlanHandler(
    logger as never,
    repo as never,
    plans as never,
    { get: () => stripe } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('changes the Stripe price first, then plans the change', async () => {
    repo.findByTenant.mockResolvedValue(
      row({ status: 'active', stripeSubscriptionId: 'sub_1' }),
    );
    plans.findOne.mockResolvedValue({
      id: 2,
      isActive: true,
      stripePriceId: 'price_2',
    });
    await handler.execute(7, { plan_id: 2 });
    expect(stripe.updateSubscriptionPrice).toHaveBeenCalledWith(
      'sub_1',
      'price_2',
    );
    expect(repo.setPendingPlan).toHaveBeenCalled();
  });

  it('no card subscription → no Stripe call', async () => {
    repo.findByTenant.mockResolvedValue(row());
    plans.findOne.mockResolvedValue({
      id: 2,
      isActive: true,
      stripePriceId: 'price_2',
    });
    await handler.execute(7, { plan_id: 2 });
    expect(stripe.updateSubscriptionPrice).not.toHaveBeenCalled();
  });

  it('a plan with no Stripe price cannot be paid by card → 400, nothing planned', async () => {
    repo.findByTenant.mockResolvedValue(
      row({ status: 'active', stripeSubscriptionId: 'sub_1' }),
    );
    plans.findOne.mockResolvedValue({
      id: 2,
      isActive: true,
      stripePriceId: null,
    });
    await expect(handler.execute(7, { plan_id: 2 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.setPendingPlan).not.toHaveBeenCalled();
  });
});
