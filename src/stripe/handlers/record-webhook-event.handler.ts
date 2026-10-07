import { Injectable } from '@nestjs/common';
import { Prisma, StripeEvent } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { StripeEventRepository } from '../repositories/stripe-event.repository';

/** Prisma's unique-constraint violation code. */
const UNIQUE_VIOLATION = 'P2002';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_VIOLATION
  );
}

/**
 * The idempotency gate (doc/notes/Phaces/14-subscriptions.md: "store the
 * event, then process"). Runs synchronously in the webhook request, BEFORE
 * anything is queued, so the event is durable in Postgres the moment Stripe
 * gets its `200` — a queue hiccup after this point can never lose the event,
 * only delay its processing. `stripe_events.stripe_event_id` (UNIQUE) is the
 * real safety net against two concurrent deliveries of the same event.
 */
@Injectable()
export class RecordWebhookEventHandler {
  constructor(
    @InjectPinoLogger(RecordWebhookEventHandler.name)
    private readonly logger: PinoLogger,
    private readonly stripeEvents: StripeEventRepository,
  ) {}

  async execute(
    event: Stripe.Event,
  ): Promise<{ row: StripeEvent; isNew: boolean }> {
    try {
      const row = await this.stripeEvents.create({
        stripeEventId: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      });
      return { row, isNew: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const row = await this.stripeEvents.findByStripeId(event.id);
      if (!row) throw error; // gone between the failed insert and this read — surface it
      this.logger.info(`Stripe event ${event.id} already on file — skipping`);
      return { row, isNew: false };
    }
  }
}
