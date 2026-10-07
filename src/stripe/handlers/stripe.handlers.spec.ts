import { BadGatewayException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';

const productsCreate = jest.fn();
const pricesCreate = jest.fn();
const pricesUpdate = jest.fn();

jest.mock('../../config/stripe.config', () => ({
  stripe: {
    products: { create: productsCreate },
    prices: { create: pricesCreate, update: pricesUpdate },
  },
}));

import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { addOneMonth } from '../../common/helpers/billing-period.helper';
import { callArg } from '../../common/testing/spec-helpers';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { StripeEventRepository } from '../repositories/stripe-event.repository';
import { ArchivePlanPriceHandler } from './archive-plan-price.handler';
import { CreatePlanPriceHandler } from './create-plan-price.handler';
import { HandleInvoiceUpcomingHandler } from './handle-invoice-upcoming.handler';
import { HandlePaymentFailedHandler } from './handle-payment-failed.handler';
import { HandlePaymentSucceededHandler } from './handle-payment-succeeded.handler';
import { HandleSubscriptionDeletedHandler } from './handle-subscription-deleted.handler';
import { ProcessWebhookHandler } from './process-webhook.handler';
import { RecordWebhookEventHandler } from './record-webhook-event.handler';

/** Builds a minimal `Stripe.Event`-shaped fixture — only what each handler reads. */
const stripeEvent = (
  type: string,
  object: Record<string, unknown>,
  id = 'evt_1',
): Stripe.Event => ({ id, type, data: { object } }) as unknown as Stripe.Event;

const paymentIntent = (over: Record<string, unknown> = {}) => ({
  customer: 'cus_1',
  amount: 5000,
  amount_received: 5000,
  ...over,
});

const invoice = (over: Record<string, unknown> = {}) => ({
  customer: 'cus_1',
  amount_due: 2500,
  ...over,
});

const stripeSubscriptionObject = (over: Record<string, unknown> = {}) => ({
  customer: 'cus_1',
  ...over,
});

const subscriptionRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: 7,
  planId: 1,
  stripeCustomerId: 'cus_1',
  status: 'trialing',
  periodStart: new Date('2026-01-01T00:00:00Z'),
  periodEnd: new Date('2026-02-01T00:00:00Z'),
  pendingPlanId: null,
  pendingPlanEffectiveAt: null,
  ...over,
});

const tenant = (over: Record<string, unknown> = {}) => ({
  id: 7,
  name: 'Acme Co',
  ...over,
});

function knownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test message', {
    code,
    clientVersion: '7.10.0',
  });
}

describe('Stripe plan-price handlers', () => {
  const logger = { info: jest.fn(), error: jest.fn() };
  let createPlanPrice: CreatePlanPriceHandler;
  let archivePlanPrice: ArchivePlanPriceHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [CreatePlanPriceHandler, ArchivePlanPriceHandler];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createPlanPrice = module.get(CreatePlanPriceHandler);
    archivePlanPrice = module.get(ArchivePlanPriceHandler);
  });

  describe('CreatePlanPriceHandler', () => {
    it('creates a Stripe product and a monthly EUR price, and returns the price id', async () => {
      productsCreate.mockResolvedValue({ id: 'prod_123' });
      pricesCreate.mockResolvedValue({ id: 'price_123' });

      const result = await createPlanPrice.execute('Pro', '50.00');

      expect(productsCreate).toHaveBeenCalledWith({ name: 'Pro' });
      expect(pricesCreate).toHaveBeenCalledWith({
        product: 'prod_123',
        currency: 'eur',
        unit_amount: 5000,
        recurring: { interval: 'month' },
      });
      expect(result).toBe('price_123');
    });

    it('throws a BadGatewayException when Stripe fails', async () => {
      productsCreate.mockRejectedValue(new Error('network error'));

      await expect(
        createPlanPrice.execute('Pro', '50.00'),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('ArchivePlanPriceHandler', () => {
    it('archives the price', async () => {
      pricesUpdate.mockResolvedValue({});

      await archivePlanPrice.execute('price_123');

      expect(pricesUpdate).toHaveBeenCalledWith('price_123', {
        active: false,
      });
    });

    it('does nothing when there is no price id', async () => {
      await archivePlanPrice.execute(null);
      expect(pricesUpdate).not.toHaveBeenCalled();
    });

    it('never throws when Stripe fails', async () => {
      pricesUpdate.mockRejectedValue(new Error('network error'));
      await expect(
        archivePlanPrice.execute('price_123'),
      ).resolves.toBeUndefined();
    });
  });
});

describe('RecordWebhookEventHandler — the idempotency gate', () => {
  const stripeEvents = {
    create: jest.fn(),
    findByStripeId: jest.fn(),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  let recordWebhookEvent: RecordWebhookEventHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RecordWebhookEventHandler,
        { provide: StripeEventRepository, useValue: stripeEvents },
        {
          provide: getLoggerToken(RecordWebhookEventHandler.name),
          useValue: logger,
        },
      ],
    }).compile();

    recordWebhookEvent = module.get(RecordWebhookEventHandler);
  });

  it('a new event is stored and reported as new', async () => {
    const row = { id: 1, stripeEventId: 'evt_1' };
    stripeEvents.create.mockResolvedValue(row);

    const result = await recordWebhookEvent.execute(
      stripeEvent('payment_intent.succeeded', paymentIntent()),
    );

    expect(stripeEvents.create).toHaveBeenCalledWith({
      stripeEventId: 'evt_1',
      type: 'payment_intent.succeeded',
      payload: expect.anything() as unknown,
    });
    expect(result).toEqual({ row, isNew: true });
  });

  it('a duplicate event (P2002) is looked up and reported as NOT new, without re-throwing', async () => {
    const row = { id: 1, stripeEventId: 'evt_1' };
    stripeEvents.create.mockRejectedValue(knownError('P2002'));
    stripeEvents.findByStripeId.mockResolvedValue(row);

    const result = await recordWebhookEvent.execute(
      stripeEvent('payment_intent.succeeded', paymentIntent()),
    );

    expect(stripeEvents.findByStripeId).toHaveBeenCalledWith('evt_1');
    expect(result).toEqual({ row, isNew: false });
  });

  it('a non-unique-violation DB error propagates', async () => {
    const dbError = knownError('P2003');
    stripeEvents.create.mockRejectedValue(dbError);

    await expect(
      recordWebhookEvent.execute(
        stripeEvent('payment_intent.succeeded', paymentIntent()),
      ),
    ).rejects.toBe(dbError);
    expect(stripeEvents.findByStripeId).not.toHaveBeenCalled();
  });

  it('a P2002 whose row is gone by the time it is looked up re-throws the original error', async () => {
    const insertError = knownError('P2002');
    stripeEvents.create.mockRejectedValue(insertError);
    stripeEvents.findByStripeId.mockResolvedValue(null);

    await expect(
      recordWebhookEvent.execute(
        stripeEvent('payment_intent.succeeded', paymentIntent()),
      ),
    ).rejects.toBe(insertError);
  });
});

describe('ProcessWebhookHandler — dispatch by type', () => {
  const stripeEvents = { markProcessed: jest.fn(), markError: jest.fn() };
  const handlePaymentSucceeded = { execute: jest.fn() };
  const handlePaymentFailed = { execute: jest.fn() };
  const handleSubscriptionDeleted = { execute: jest.fn() };
  const handleInvoiceUpcoming = { execute: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  let processWebhook: ProcessWebhookHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProcessWebhookHandler,
        { provide: StripeEventRepository, useValue: stripeEvents },
        {
          provide: HandlePaymentSucceededHandler,
          useValue: handlePaymentSucceeded,
        },
        { provide: HandlePaymentFailedHandler, useValue: handlePaymentFailed },
        {
          provide: HandleSubscriptionDeletedHandler,
          useValue: handleSubscriptionDeleted,
        },
        {
          provide: HandleInvoiceUpcomingHandler,
          useValue: handleInvoiceUpcoming,
        },
        {
          provide: getLoggerToken(ProcessWebhookHandler.name),
          useValue: logger,
        },
      ],
    }).compile();

    processWebhook = module.get(ProcessWebhookHandler);
  });

  it('routes payment_intent.succeeded to HandlePaymentSucceededHandler', async () => {
    const event = stripeEvent('payment_intent.succeeded', paymentIntent());
    await processWebhook.execute(1, event);
    expect(handlePaymentSucceeded.execute).toHaveBeenCalledWith(event);
    expect(handlePaymentFailed.execute).not.toHaveBeenCalled();
    expect(handleSubscriptionDeleted.execute).not.toHaveBeenCalled();
    expect(handleInvoiceUpcoming.execute).not.toHaveBeenCalled();
  });

  it('routes payment_intent.payment_failed to HandlePaymentFailedHandler', async () => {
    const event = stripeEvent('payment_intent.payment_failed', paymentIntent());
    await processWebhook.execute(2, event);
    expect(handlePaymentFailed.execute).toHaveBeenCalledWith(event);
    expect(handlePaymentSucceeded.execute).not.toHaveBeenCalled();
  });

  it('routes customer.subscription.deleted to HandleSubscriptionDeletedHandler', async () => {
    const event = stripeEvent(
      'customer.subscription.deleted',
      stripeSubscriptionObject(),
    );
    await processWebhook.execute(3, event);
    expect(handleSubscriptionDeleted.execute).toHaveBeenCalledWith(event);
  });

  it('routes invoice.upcoming to HandleInvoiceUpcomingHandler', async () => {
    const event = stripeEvent('invoice.upcoming', invoice());
    await processWebhook.execute(4, event);
    expect(handleInvoiceUpcoming.execute).toHaveBeenCalledWith(event);
  });

  it('an unknown event type is a no-op — stored only, still marked processed', async () => {
    const event = stripeEvent('charge.refunded', {});
    await expect(processWebhook.execute(5, event)).resolves.toBeUndefined();
    expect(handlePaymentSucceeded.execute).not.toHaveBeenCalled();
    expect(handlePaymentFailed.execute).not.toHaveBeenCalled();
    expect(handleSubscriptionDeleted.execute).not.toHaveBeenCalled();
    expect(handleInvoiceUpcoming.execute).not.toHaveBeenCalled();
    expect(stripeEvents.markProcessed).toHaveBeenCalledWith(5);
    expect(stripeEvents.markError).not.toHaveBeenCalled();
  });

  it('marks the row processed when the matching handler succeeds', async () => {
    const event = stripeEvent('payment_intent.succeeded', paymentIntent());
    handlePaymentSucceeded.execute.mockResolvedValue(undefined);
    await processWebhook.execute(6, event);
    expect(stripeEvents.markProcessed).toHaveBeenCalledWith(6);
    expect(stripeEvents.markError).not.toHaveBeenCalled();
  });

  it('records the error and re-throws (so BullMQ retries) when the handler throws', async () => {
    const event = stripeEvent('payment_intent.succeeded', paymentIntent());
    const failure = new Error('downstream boom');
    handlePaymentSucceeded.execute.mockRejectedValue(failure);

    await expect(processWebhook.execute(7, event)).rejects.toBe(failure);

    expect(stripeEvents.markError).toHaveBeenCalledWith(7, String(failure));
    expect(stripeEvents.markProcessed).not.toHaveBeenCalled();
  });
});

describe('Stripe event handlers — customer resolution and status transitions', () => {
  const subscriptions = {
    findByStripeCustomerId: jest.fn(),
    setStatus: jest.fn(),
    setPeriod: jest.fn(),
  };
  const tenants = { findOne: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  let handlePaymentSucceeded: HandlePaymentSucceededHandler;
  let handlePaymentFailed: HandlePaymentFailedHandler;
  let handleSubscriptionDeleted: HandleSubscriptionDeletedHandler;
  let handleInvoiceUpcoming: HandleInvoiceUpcomingHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      HandlePaymentSucceededHandler,
      HandlePaymentFailedHandler,
      HandleSubscriptionDeletedHandler,
      HandleInvoiceUpcomingHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: SubscriptionsService, useValue: subscriptions },
        { provide: TenantsService, useValue: tenants },
        { provide: NotificationsService, useValue: notifications },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    handlePaymentSucceeded = module.get(HandlePaymentSucceededHandler);
    handlePaymentFailed = module.get(HandlePaymentFailedHandler);
    handleSubscriptionDeleted = module.get(HandleSubscriptionDeletedHandler);
    handleInvoiceUpcoming = module.get(HandleInvoiceUpcomingHandler);
  });

  describe('HandlePaymentSucceededHandler', () => {
    it('resolves a customer id given as a plain string', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      tenants.findOne.mockResolvedValue(tenant());
      await handlePaymentSucceeded.execute(
        stripeEvent(
          'payment_intent.succeeded',
          paymentIntent({ customer: 'cus_1' }),
        ),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('resolves a customer id given as an expanded { id } object', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      tenants.findOne.mockResolvedValue(tenant());
      await handlePaymentSucceeded.execute(
        stripeEvent(
          'payment_intent.succeeded',
          paymentIntent({ customer: { id: 'cus_1' } }),
        ),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('a missing customer is logged and ignored, never crashes', async () => {
      await expect(
        handlePaymentSucceeded.execute(
          stripeEvent(
            'payment_intent.succeeded',
            paymentIntent({ customer: null }),
          ),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.findByStripeCustomerId).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('no subscription for that Stripe customer is logged and ignored', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(null);
      await expect(
        handlePaymentSucceeded.execute(
          stripeEvent('payment_intent.succeeded', paymentIntent()),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.setStatus).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('sets the subscription active and rolls the period forward exactly one month', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        subscriptionRow({ tenantId: 7 }),
      );
      tenants.findOne.mockResolvedValue(tenant());

      await handlePaymentSucceeded.execute(
        stripeEvent('payment_intent.succeeded', paymentIntent()),
      );

      expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'active');
      const periodStart = callArg<Date>(subscriptions.setPeriod, 0, 1);
      const periodEnd = callArg<Date>(subscriptions.setPeriod, 0, 2);
      expect(subscriptions.setPeriod).toHaveBeenCalledWith(
        7,
        periodStart,
        periodEnd,
      );
      expect(periodEnd.getTime()).toBe(addOneMonth(periodStart).getTime());
    });

    it('notifies the platform of the payment received, amount in euros', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        subscriptionRow({ tenantId: 7 }),
      );
      tenants.findOne.mockResolvedValue(tenant({ name: 'Acme Co' }));

      await handlePaymentSucceeded.execute(
        stripeEvent(
          'payment_intent.succeeded',
          paymentIntent({ amount_received: 12345 }),
        ),
      );

      expect(notifications.dispatch).toHaveBeenCalledWith('payment_received', {
        payload: {
          tenant_id: 7,
          company_name: 'Acme Co',
          amount: '123.45',
        },
      });
    });
  });

  describe('HandlePaymentFailedHandler', () => {
    it('resolves a customer id given as a plain string', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      tenants.findOne.mockResolvedValue(tenant());
      await handlePaymentFailed.execute(
        stripeEvent(
          'payment_intent.payment_failed',
          paymentIntent({ customer: 'cus_1' }),
        ),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('resolves a customer id given as an expanded { id } object', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      tenants.findOne.mockResolvedValue(tenant());
      await handlePaymentFailed.execute(
        stripeEvent(
          'payment_intent.payment_failed',
          paymentIntent({ customer: { id: 'cus_1' } }),
        ),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('a missing customer is logged and ignored, never crashes', async () => {
      await expect(
        handlePaymentFailed.execute(
          stripeEvent(
            'payment_intent.payment_failed',
            paymentIntent({ customer: undefined }),
          ),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.findByStripeCustomerId).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('no subscription for that Stripe customer is logged and ignored', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(null);
      await expect(
        handlePaymentFailed.execute(
          stripeEvent('payment_intent.payment_failed', paymentIntent()),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.setStatus).not.toHaveBeenCalled();
    });

    it('sets the subscription past_due — never cancelled on a failed payment', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        subscriptionRow({ tenantId: 7 }),
      );
      tenants.findOne.mockResolvedValue(tenant());

      await handlePaymentFailed.execute(
        stripeEvent('payment_intent.payment_failed', paymentIntent()),
      );

      expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'past_due');
      expect(subscriptions.setStatus).not.toHaveBeenCalledWith(7, 'cancelled');
    });

    it('notifies BOTH the platform alert and the tenant alert, amount in euros', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        subscriptionRow({ tenantId: 7 }),
      );
      tenants.findOne.mockResolvedValue(tenant({ name: 'Acme Co' }));

      await handlePaymentFailed.execute(
        stripeEvent(
          'payment_intent.payment_failed',
          paymentIntent({ amount: 4999 }),
        ),
      );

      expect(notifications.dispatch).toHaveBeenCalledWith('payment_failed', {
        payload: { tenant_id: 7, company_name: 'Acme Co', amount: '49.99' },
      });
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'subscription_payment_failed',
        {
          tenantId: 7,
          dedupeDays: 1,
          payload: { amount: '49.99' },
        },
      );
      expect(notifications.dispatch).toHaveBeenCalledTimes(2);
    });
  });

  describe('HandleSubscriptionDeletedHandler', () => {
    it('resolves a customer id given as a plain string', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      await handleSubscriptionDeleted.execute(
        stripeEvent(
          'customer.subscription.deleted',
          stripeSubscriptionObject({ customer: 'cus_1' }),
        ),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('resolves a customer id given as an expanded { id } object', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      await handleSubscriptionDeleted.execute(
        stripeEvent(
          'customer.subscription.deleted',
          stripeSubscriptionObject({ customer: { id: 'cus_1' } }),
        ),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('a missing customer is logged and ignored, never crashes', async () => {
      await expect(
        handleSubscriptionDeleted.execute(
          stripeEvent(
            'customer.subscription.deleted',
            stripeSubscriptionObject({ customer: null }),
          ),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.findByStripeCustomerId).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('no subscription for that Stripe customer is logged and ignored', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(null);
      await expect(
        handleSubscriptionDeleted.execute(
          stripeEvent(
            'customer.subscription.deleted',
            stripeSubscriptionObject(),
          ),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.setStatus).not.toHaveBeenCalled();
    });

    it('sets the subscription cancelled', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        subscriptionRow({ tenantId: 7 }),
      );
      await handleSubscriptionDeleted.execute(
        stripeEvent(
          'customer.subscription.deleted',
          stripeSubscriptionObject(),
        ),
      );
      expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'cancelled');
    });
  });

  describe('HandleInvoiceUpcomingHandler', () => {
    it('resolves a customer id given as a plain string', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      await handleInvoiceUpcoming.execute(
        stripeEvent('invoice.upcoming', invoice({ customer: 'cus_1' })),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('resolves a customer id given as an expanded { id } object', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(subscriptionRow());
      await handleInvoiceUpcoming.execute(
        stripeEvent('invoice.upcoming', invoice({ customer: { id: 'cus_1' } })),
      );
      expect(subscriptions.findByStripeCustomerId).toHaveBeenCalledWith(
        'cus_1',
      );
    });

    it('a missing customer is logged and ignored, never crashes', async () => {
      await expect(
        handleInvoiceUpcoming.execute(
          stripeEvent('invoice.upcoming', invoice({ customer: null })),
        ),
      ).resolves.toBeUndefined();
      expect(subscriptions.findByStripeCustomerId).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('no subscription for that Stripe customer is logged and ignored', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(null);
      await expect(
        handleInvoiceUpcoming.execute(
          stripeEvent('invoice.upcoming', invoice()),
        ),
      ).resolves.toBeUndefined();
      expect(notifications.dispatch).not.toHaveBeenCalled();
    });

    it('notifies the tenant of the upcoming renewal, deduped for 3 days', async () => {
      subscriptions.findByStripeCustomerId.mockResolvedValue(
        subscriptionRow({
          tenantId: 7,
          periodEnd: new Date('2026-03-15T00:00:00Z'),
        }),
      );

      await handleInvoiceUpcoming.execute(
        stripeEvent('invoice.upcoming', invoice({ amount_due: 5000 })),
      );

      expect(notifications.dispatch).toHaveBeenCalledWith(
        'subscription_renewal_upcoming',
        {
          tenantId: 7,
          dedupeDays: 3,
          payload: { amount_due: '50.00', period_end: '2026-03-15' },
        },
      );
    });
  });
});
