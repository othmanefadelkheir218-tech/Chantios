const SECRET = 'whsec_test_secret';

jest.mock('../config/env.config', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  },
}));

import { BadRequestException } from '@nestjs/common';
import { stripe } from '../config/stripe.config';
import { ArchivePlanPriceHandler } from './handlers/archive-plan-price.handler';
import { CreatePlanPriceHandler } from './handlers/create-plan-price.handler';
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
  const controller = new StripeController(
    new StripeService(
      {} as CreatePlanPriceHandler,
      {} as ArchivePlanPriceHandler,
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

  it('accepts a correctly signed event', () => {
    const { req, signature } = signedRequest(SECRET);
    expect(controller.receive(req, signature)).toEqual({ received: true });
  });

  it('rejects a wrong signature', () => {
    const { req, signature } = signedRequest('whsec_other_secret');
    expect(() => controller.receive(req, signature)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a body changed after signing', () => {
    const { signature } = signedRequest(SECRET);
    const tampered = { rawBody: Buffer.from(payload + ' ') } as never;
    expect(() => controller.receive(tampered, signature)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a missing signature header', () => {
    const { req } = signedRequest(SECRET);
    expect(() => controller.receive(req, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('rejects a missing raw body', () => {
    expect(() =>
      controller.receive({ rawBody: undefined } as never, 't=1,v1=x'),
    ).toThrow(BadRequestException);
  });
});
