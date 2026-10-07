const SECRET = 'whsec_test_secret';

jest.mock('../config/env.config', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  },
}));

import { BadRequestException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { stripe } from '../config/stripe.config';
import { ArchivePlanPriceHandler } from './handlers/archive-plan-price.handler';
import { CreatePlanPriceHandler } from './handlers/create-plan-price.handler';
import { PushOverageInvoiceItemHandler } from './handlers/push-overage-invoice-item.handler';
import { RecordWebhookEventHandler } from './handlers/record-webhook-event.handler';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

const payload = JSON.stringify({
  id: 'evt_test_1',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: { object: {} },
});

/** Builds a request the same way Stripe signs it. */
const signedRequest = (secret: string, body = payload) => ({
  req: { rawBody: Buffer.from(body) } as never,
  signature: stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  }),
});

describe('StripeController (webhook)', () => {
  const queue = {
    add: jest.fn().mockResolvedValue(undefined),
  } as unknown as Queue;
  const recordWebhookEvent = {
    execute: jest.fn().mockResolvedValue({ row: { id: 1 }, isNew: true }),
  } as unknown as RecordWebhookEventHandler;
  const controller = new StripeController(
    new StripeService(
      {} as CreatePlanPriceHandler,
      {} as ArchivePlanPriceHandler,
      {} as PushOverageInvoiceItemHandler,
      recordWebhookEvent,
      queue,
    ),
  );

  it('answers 200 by default (Nest POST is 201 otherwise)', () => {
    const code = Reflect.getMetadata(
      '__httpCode__',
      // eslint-disable-next-line @typescript-eslint/unbound-method -- only reading metadata
      controller.receive,
    ) as number;
    expect(code).toBe(200);
  });

  it('accepts a correctly signed event', async () => {
    const { req, signature } = signedRequest(SECRET);
    await expect(controller.receive(req, signature)).resolves.toEqual({
      received: true,
    });
  });

  it('rejects a wrong signature', async () => {
    const { req, signature } = signedRequest('whsec_other_secret');
    await expect(controller.receive(req, signature)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a body changed after signing', async () => {
    const { signature } = signedRequest(SECRET);
    const tampered = { rawBody: Buffer.from(payload + ' ') } as never;
    await expect(controller.receive(tampered, signature)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a missing signature header', async () => {
    const { req } = signedRequest(SECRET);
    await expect(controller.receive(req, undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a missing raw body', async () => {
    await expect(
      controller.receive({ rawBody: undefined } as never, 't=1,v1=x'),
    ).rejects.toThrow(BadRequestException);
  });
});
