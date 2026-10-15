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
import { CheckoutSessionInput } from './dto/checkout-session.dto';
import { CreateCheckoutSessionHandler } from './handlers/create-checkout-session.handler';
import { CreateCustomerHandler } from './handlers/create-customer.handler';
import { CreatePortalSessionHandler } from './handlers/create-portal-session.handler';
import { EndSubscriptionNowHandler } from './handlers/end-subscription-now.handler';
import { FindOpenInvoiceUrlHandler } from './handlers/find-open-invoice-url.handler';
import { SetCancelAtPeriodEndHandler } from './handlers/set-cancel-at-period-end.handler';
import { UpdateSubscriptionPriceHandler } from './handlers/update-subscription-price.handler';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly createPlanPriceHandler: CreatePlanPriceHandler,
    private readonly archivePlanPriceHandler: ArchivePlanPriceHandler,
    private readonly pushOverageInvoiceItemHandler: PushOverageInvoiceItemHandler,
    private readonly recordWebhookEventHandler: RecordWebhookEventHandler,
    private readonly createCustomerHandler: CreateCustomerHandler,
    private readonly createCheckoutSessionHandler: CreateCheckoutSessionHandler,
    private readonly createPortalSessionHandler: CreatePortalSessionHandler,
    private readonly setCancelAtPeriodEndHandler: SetCancelAtPeriodEndHandler,
    private readonly updateSubscriptionPriceHandler: UpdateSubscriptionPriceHandler,
    private readonly endSubscriptionNowHandler: EndSubscriptionNowHandler,
    private readonly findOpenInvoiceUrlHandler: FindOpenInvoiceUrlHandler,
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
    invoiceId: string | null = null,
  ): Promise<void> {
    return this.pushOverageInvoiceItemHandler.execute(
      stripeCustomerId,
      amount,
      description,
      idempotencyKey,
      invoiceId,
    );
  }

  // ---- Step 21 — paying by card (Stripe Checkout). Each throws 502 if Stripe fails. ----

  /** The company's account in Stripe. Returns its id. */
  createCustomer(
    tenantId: number,
    name: string,
    email: string,
  ): Promise<string> {
    return this.createCustomerHandler.execute(tenantId, name, email);
  }

  /** The Stripe card page. Returns its URL. */
  createCheckoutSession(input: CheckoutSessionInput): Promise<string> {
    return this.createCheckoutSessionHandler.execute(input);
  }

  /** The Stripe Customer Portal (card + invoices). Returns its URL. */
  createPortalSession(
    customerId: string,
    locale: 'fr' | 'en' | 'nl',
    returnUrl: string,
  ): Promise<string> {
    return this.createPortalSessionHandler.execute(
      customerId,
      locale,
      returnUrl,
    );
  }

  /** Cancel (`true`) or keep (`false`) at the end of the paid month. */
  setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
    return this.setCancelAtPeriodEndHandler.execute(subscriptionId, cancel);
  }

  /** A plan change: the new price from the next invoice, no proration. */
  updateSubscriptionPrice(
    subscriptionId: string,
    priceId: string,
  ): Promise<void> {
    return this.updateSubscriptionPriceHandler.execute(subscriptionId, priceId);
  }

  /** Ends an old card subscription now — before a blocked company pays again. */
  endSubscriptionNow(subscriptionId: string): Promise<void> {
    return this.endSubscriptionNowHandler.execute(subscriptionId);
  }

  /** The Stripe page of the unpaid invoice, or `null`. */
  findOpenInvoiceUrl(subscriptionId: string): Promise<string | null> {
    return this.findOpenInvoiceUrlHandler.execute(subscriptionId);
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
