import type Stripe from 'stripe';
import { toSubscriptionState } from '../helpers/stripe-subscription.helper';
import { HandleCheckoutCompletedHandler } from './handle-checkout-completed.handler';
import { HandleInvoiceCreatedHandler } from './handle-invoice-created.handler';
import { HandlePaymentSucceededHandler } from './handle-payment-succeeded.handler';
import { HandleSubscriptionDeletedHandler } from './handle-subscription-deleted.handler';
import { HandleSubscriptionUpdatedHandler } from './handle-subscription-updated.handler';

/** Step 21 — paying by card: the webhook side. */

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const stripeEvent = (
  type: string,
  object: Record<string, unknown>,
): Stripe.Event =>
  ({ id: 'evt_1', type, data: { object } }) as unknown as Stripe.Event;

const state = {
  stripeSubscriptionId: 'sub_new',
  stripePriceId: 'price_1',
  periodStart: new Date('2026-10-15T00:00:00Z'),
  periodEnd: new Date('2026-11-15T00:00:00Z'),
  cancelAtPeriodEnd: false,
};

const row = (over: Record<string, unknown> = {}) => ({
  tenantId: 7,
  stripeCustomerId: 'cus_1',
  stripeSubscriptionId: 'sub_new',
  status: 'active',
  pendingPlanId: null,
  ...over,
});

describe('toSubscriptionState', () => {
  it('reads the period from the item (API 2025-03-31+) and the cancel flag', () => {
    const sub = {
      id: 'sub_1',
      cancel_at_period_end: true,
      items: {
        data: [
          {
            price: { id: 'price_9' },
            current_period_start: 1_760_486_400,
            current_period_end: 1_763_164_800,
          },
        ],
      },
    } as unknown as Stripe.Subscription;
    expect(toSubscriptionState(sub)).toEqual({
      stripeSubscriptionId: 'sub_1',
      stripePriceId: 'price_9',
      periodStart: new Date(1_760_486_400 * 1000),
      periodEnd: new Date(1_763_164_800 * 1000),
      cancelAtPeriodEnd: true,
    });
  });
});

describe('HandleCheckoutCompletedHandler', () => {
  const subscriptions = {
    syncStripeSubscription: jest.fn(),
    setStatus: jest.fn(),
  };
  const retrieve = { execute: jest.fn() };
  const handler = new HandleCheckoutCompletedHandler(
    logger as never,
    subscriptions as never,
    retrieve as never,
  );
  const session = (over: Record<string, unknown> = {}) => ({
    mode: 'subscription',
    client_reference_id: '7',
    subscription: 'sub_new',
    ...over,
  });

  beforeEach(() => jest.clearAllMocks());

  it('paid now → saves the card subscription and opens the company (active)', async () => {
    retrieve.execute.mockResolvedValue({ state, status: 'active' });
    await handler.execute(stripeEvent('checkout.session.completed', session()));
    expect(subscriptions.syncStripeSubscription).toHaveBeenCalledWith(7, state);
    expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'active');
  });

  it('paid during a trial → saved, status untouched (first charge at the trial end, Q1)', async () => {
    retrieve.execute.mockResolvedValue({ state, status: 'trialing' });
    await handler.execute(stripeEvent('checkout.session.completed', session()));
    expect(subscriptions.syncStripeSubscription).toHaveBeenCalledWith(7, state);
    expect(subscriptions.setStatus).not.toHaveBeenCalled();
  });

  it('a one-off payment checkout is ignored', async () => {
    await handler.execute(
      stripeEvent('checkout.session.completed', session({ mode: 'payment' })),
    );
    expect(retrieve.execute).not.toHaveBeenCalled();
  });
});

describe('HandleSubscriptionUpdatedHandler', () => {
  const subscriptions = {
    findByStripeSubscriptionId: jest.fn(),
    syncStripeSubscription: jest.fn(),
  };
  const retrieve = { execute: jest.fn() };
  const handler = new HandleSubscriptionUpdatedHandler(
    logger as never,
    subscriptions as never,
    retrieve as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('copies the LATEST Stripe state (events can arrive out of order)', async () => {
    subscriptions.findByStripeSubscriptionId.mockResolvedValue(row());
    retrieve.execute.mockResolvedValue({ state, status: 'active' });
    await handler.execute(
      stripeEvent('customer.subscription.updated', { id: 'sub_new' }),
    );
    expect(retrieve.execute).toHaveBeenCalledWith('sub_new');
    expect(subscriptions.syncStripeSubscription).toHaveBeenCalledWith(7, state);
  });

  it('a subscription that is not ours (yet) is ignored', async () => {
    subscriptions.findByStripeSubscriptionId.mockResolvedValue(null);
    await handler.execute(
      stripeEvent('customer.subscription.updated', { id: 'sub_x' }),
    );
    expect(subscriptions.syncStripeSubscription).not.toHaveBeenCalled();
  });
});

describe('HandleSubscriptionDeletedHandler — card subscriptions', () => {
  const subscriptions = {
    findByStripeCustomerId: jest.fn(),
    setStatus: jest.fn(),
    clearStripeSubscription: jest.fn(),
  };
  const handler = new HandleSubscriptionDeletedHandler(
    logger as never,
    subscriptions as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('the current one ended (cancel at period end) → blocked, card subscription forgotten', async () => {
    subscriptions.findByStripeCustomerId.mockResolvedValue(row());
    await handler.execute(
      stripeEvent('customer.subscription.deleted', {
        id: 'sub_new',
        customer: 'cus_1',
      }),
    );
    expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'cancelled');
    expect(subscriptions.clearStripeSubscription).toHaveBeenCalledWith(7);
  });

  it('an OLD one ended after the company paid again (Q8) → nothing blocked', async () => {
    subscriptions.findByStripeCustomerId.mockResolvedValue(row());
    await handler.execute(
      stripeEvent('customer.subscription.deleted', {
        id: 'sub_old',
        customer: 'cus_1',
      }),
    );
    expect(subscriptions.setStatus).not.toHaveBeenCalled();
    expect(subscriptions.clearStripeSubscription).not.toHaveBeenCalled();
  });
});

describe('HandlePaymentSucceededHandler — card subscriptions', () => {
  const subscriptions = {
    findByStripeCustomerId: jest.fn(),
    setStatus: jest.fn(),
    setPeriod: jest.fn(),
    movePendingPlanDate: jest.fn(),
  };
  const tenants = { findOne: jest.fn().mockResolvedValue({ name: 'Acme' }) };
  const notifications = { dispatch: jest.fn() };
  const handler = new HandlePaymentSucceededHandler(
    logger as never,
    subscriptions as never,
    tenants as never,
    notifications as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('a card company → active, the dates are left to Stripe (Q3)', async () => {
    subscriptions.findByStripeCustomerId.mockResolvedValue(
      row({ status: 'past_due' }),
    );
    await handler.execute(
      stripeEvent('payment_intent.succeeded', {
        customer: 'cus_1',
        amount_received: 1000,
      }),
    );
    expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'active');
    expect(subscriptions.setPeriod).not.toHaveBeenCalled();
  });

  it('no card subscription (dev tools) → the period still rolls here', async () => {
    subscriptions.findByStripeCustomerId.mockResolvedValue(
      row({ stripeSubscriptionId: null }),
    );
    await handler.execute(
      stripeEvent('payment_intent.succeeded', {
        customer: 'cus_1',
        amount_received: 1000,
      }),
    );
    expect(subscriptions.setPeriod).toHaveBeenCalled();
  });
});

describe('HandleInvoiceCreatedHandler (Q2)', () => {
  const subscriptions = { findByStripeSubscriptionId: jest.fn() };
  const billing = { renewForStripeInvoice: jest.fn() };
  const handler = new HandleInvoiceCreatedHandler(
    logger as never,
    subscriptions as never,
    { get: () => billing } as never,
  );
  const invoice = (over: Record<string, unknown> = {}) => ({
    id: 'in_1',
    status: 'draft',
    billing_reason: 'subscription_cycle',
    parent: { subscription_details: { subscription: 'sub_new' } },
    period_start: 1_760_486_400,
    period_end: 1_763_164_800,
    ...over,
  });

  beforeEach(() => jest.clearAllMocks());

  it('a monthly draft invoice → renewal of the month that ended, overage onto it', async () => {
    subscriptions.findByStripeSubscriptionId.mockResolvedValue(row());
    await handler.execute(stripeEvent('invoice.created', invoice()));
    expect(billing.renewForStripeInvoice).toHaveBeenCalledWith(7, {
      invoiceId: 'in_1',
      periodStart: new Date(1_760_486_400 * 1000),
      periodEnd: new Date(1_763_164_800 * 1000),
    });
  });

  it('an invoice already final → renewal still runs, overage waits (no invoice id)', async () => {
    subscriptions.findByStripeSubscriptionId.mockResolvedValue(row());
    await handler.execute(
      stripeEvent('invoice.created', invoice({ status: 'open' })),
    );
    expect(billing.renewForStripeInvoice).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ invoiceId: null }),
    );
  });

  it('the first invoice of a new subscription is not a renewal', async () => {
    await handler.execute(
      stripeEvent(
        'invoice.created',
        invoice({ billing_reason: 'subscription_create' }),
      ),
    );
    expect(billing.renewForStripeInvoice).not.toHaveBeenCalled();
  });
});
