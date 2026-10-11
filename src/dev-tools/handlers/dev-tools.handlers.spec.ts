import { NotFoundException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import { PlansService } from '../../plans/plans.service';
import { HandlePaymentFailedHandler } from '../../stripe/handlers/handle-payment-failed.handler';
import { HandlePaymentSucceededHandler } from '../../stripe/handlers/handle-payment-succeeded.handler';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TrialEndCron } from '../../crons/trial-end.cron';
import { RunJobHandler } from './run-job.handler';
import { SimulatePaymentHandler } from './simulate-payment.handler';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as PinoLogger;

describe('Dev tools (step 20)', () => {
  const job = { run: jest.fn() };
  const succeeded = { execute: jest.fn() };
  const failed = { execute: jest.fn() };
  const moduleRef = {
    get: jest.fn((token: unknown) =>
      token === TrialEndCron
        ? job
        : token === HandlePaymentSucceededHandler
          ? succeeded
          : token === HandlePaymentFailedHandler
            ? failed
            : undefined,
    ),
  };
  const subscriptions = {
    findByTenant: jest.fn(),
    setStripeCustomerId: jest.fn(),
  };
  const plans = { findOne: jest.fn() };

  beforeEach(() => {
    job.run.mockReset();
    succeeded.execute.mockReset();
    failed.execute.mockReset();
    subscriptions.findByTenant.mockReset();
    subscriptions.setStripeCustomerId.mockReset();
  });

  it('runs the real job class by name', async () => {
    job.run.mockResolvedValue({ reminded: 1, blocked: 0 });
    const handler = new RunJobHandler(
      logger,
      moduleRef as unknown as ModuleRef,
    );
    await expect(handler.execute('trial-end')).resolves.toEqual({
      job: 'trial-end',
      result: { reminded: 1, blocked: 0 },
    });
  });

  it('an unknown job name is a 404', async () => {
    const handler = new RunJobHandler(
      logger,
      moduleRef as unknown as ModuleRef,
    );
    await expect(handler.execute('drop-database')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('simulated payment: gives a fake Stripe customer, then runs the real webhook handler', async () => {
    subscriptions.findByTenant.mockResolvedValue({
      tenantId: 4,
      planId: 1,
      stripeCustomerId: null,
    });
    plans.findOne.mockResolvedValue({ basePrice: '49.00' });
    const handler = new SimulatePaymentHandler(
      logger,
      moduleRef as unknown as ModuleRef,
      subscriptions as unknown as SubscriptionsService,
      plans as unknown as PlansService,
    );
    await handler.execute(4, 'succeeded');
    expect(subscriptions.setStripeCustomerId).toHaveBeenCalledWith(
      4,
      'cus_dev_4',
    );
    expect(succeeded.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: 'cus_dev_4',
            amount: 4900,
            amount_received: 4900,
          },
        },
      }),
    );
    expect(failed.execute).not.toHaveBeenCalled();
  });

  it('a failed payment uses the payment_failed handler and keeps a real customer id', async () => {
    subscriptions.findByTenant.mockResolvedValue({
      tenantId: 4,
      planId: 1,
      stripeCustomerId: 'cus_real',
    });
    plans.findOne.mockResolvedValue({ basePrice: '10' });
    const handler = new SimulatePaymentHandler(
      logger,
      moduleRef as unknown as ModuleRef,
      subscriptions as unknown as SubscriptionsService,
      plans as unknown as PlansService,
    );
    await handler.execute(4, 'failed');
    expect(subscriptions.setStripeCustomerId).not.toHaveBeenCalled();
    expect(failed.execute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'payment_intent.payment_failed' }),
    );
  });
});
