import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import Stripe from 'stripe';
import { env } from '../config/env.config';
import { stripe } from '../config/stripe.config';
import { STRIPE_WEBHOOKS_QUEUE, WebhookJobData } from './dto/webhook.dto';
import { ArchivePlanPriceHandler } from './handlers/archive-plan-price.handler';
import { CreatePlanPriceHandler } from './handlers/create-plan-price.handler';
import { PushOverageInvoiceItemHandler } from './handlers/push-overage-invoice-item.handler';
import { RecordWebhookEventHandler } from './handlers/record-webhook-event.handler';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly createPlanPriceHandler: CreatePlanPriceHandler,
    private readonly archivePlanPriceHandler: ArchivePlanPriceHandler,
    private readonly pushOverageInvoiceItemHandler: PushOverageInvoiceItemHandler,
    private readonly recordWebhookEventHandler: RecordWebhookEventHandler,
    @InjectQueue(STRIPE_WEBHOOKS_QUEUE)
    private readonly queue: Queue<WebhookJobData>,
  ) {}

  /** A new Stripe Product + Price for a plan. Throws if Stripe fails. */
  createPlanPrice(name: string, basePrice: string): Promise<string> {
    return this.createPlanPriceHandler.execute(name, basePrice);
  }

  /** Archives a plan's Stripe Price. Best-effort — never throws. */
  archivePlanPrice(stripePriceId: string | null): Promise<void> {
    return this.archivePlanPriceHandler.execute(stripePriceId);
  }

  /** One renewal's total overage, pushed as a Stripe invoice item. Best-effort — never throws. */
  pushOverageInvoiceItem(
    stripeCustomerId: string | null,
    amount: Prisma.Decimal,
    description: string,
    idempotencyKey: string,
  ): Promise<void> {
    return this.pushOverageInvoiceItemHandler.execute(
      stripeCustomerId,
      amount,
      description,
      idempotencyKey,
    );
  }

  /** Checks the Stripe signature. Throws 400 if the request is not from Stripe. */
  constructEvent(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Stripe.Event {
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing body or stripe-signature header');
    }
    try {
      return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }
  }

  /**
   * Stores a verified event FIRST — synchronously, durable in Postgres before
   * Stripe ever sees a response — then queues it for `StripeWebhookProcessor`
   * to dispatch. A duplicate delivery is stored once (`RecordWebhookEventHandler`)
   * and never re-queued. Only the queue step is best-effort: if Redis is down
   * the event is still safely on file (`processed_at` NULL, `error` NULL) for
   * manual replay — it is the signature check and the DB write that must stay
   * able to fail the request (so Stripe retries a genuine outage), not this.
   */
  async recordAndEnqueue(event: Stripe.Event): Promise<void> {
    const { row, isNew } = await this.recordWebhookEventHandler.execute(event);
    if (!isNew) return;

    try {
      await this.queue.add(
        'process',
        { eventRowId: row.id, event },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.log(`Queued Stripe event ${event.type} (${event.id})`);
    } catch (error) {
      this.logger.error(
        `Stored Stripe event ${event.id} but failed to queue it for ` +
          `processing — it will stay unprocessed until replayed: ${String(error)}`,
      );
    }
  }
}
