import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { StripeEventRepository } from '../repositories/stripe-event.repository';
import { HandleCheckoutCompletedHandler } from './handle-checkout-completed.handler';
import { HandleInvoiceCreatedHandler } from './handle-invoice-created.handler';
import { HandleInvoiceUpcomingHandler } from './handle-invoice-upcoming.handler';
import { HandlePaymentFailedHandler } from './handle-payment-failed.handler';
import { HandlePaymentSucceededHandler } from './handle-payment-succeeded.handler';
import { HandleSubscriptionDeletedHandler } from './handle-subscription-deleted.handler';
import { HandleSubscriptionUpdatedHandler } from './handle-subscription-updated.handler';

/**
 * Dispatches an ALREADY-STORED Stripe event by type (the storing + the
 * idempotency check happened synchronously in `RecordWebhookEventHandler`,
 * before this was ever queued — see its doc comment). Marks the row
 * processed on success, or records the error and re-throws so BullMQ retries
 * this job — never re-inserts the row.
 *
 * A job can be handed to the worker more than once (a stalled-job redelivery
 * after the API restarts, a retry after the work was done but before the row
 * was marked). The row's `processed_at` is the guard: an event already
 * processed is skipped, so its effects (status, period roll, alerts) happen
 * once.
 */
@Injectable()
export class ProcessWebhookHandler {
  constructor(
    @InjectPinoLogger(ProcessWebhookHandler.name)
    private readonly logger: PinoLogger,
    private readonly stripeEvents: StripeEventRepository,
    private readonly handlePaymentSucceeded: HandlePaymentSucceededHandler,
    private readonly handlePaymentFailed: HandlePaymentFailedHandler,
    private readonly handleSubscriptionDeleted: HandleSubscriptionDeletedHandler,
    private readonly handleInvoiceUpcoming: HandleInvoiceUpcomingHandler,
    private readonly handleCheckoutCompleted: HandleCheckoutCompletedHandler,
    private readonly handleSubscriptionUpdated: HandleSubscriptionUpdatedHandler,
    private readonly handleInvoiceCreated: HandleInvoiceCreatedHandler,
  ) {}

  async execute(eventRowId: number, event: Stripe.Event): Promise<void> {
    const row = await this.stripeEvents.findById(eventRowId);
    if (row?.processedAt) {
      this.logger.warn(
        `Stripe event ${event.id} was already processed at ${row.processedAt.toISOString()} — skipping`,
      );
      return;
    }

    try {
      await this.dispatch(event);
      await this.stripeEvents.markProcessed(eventRowId);
      this.logger.info(`Processed Stripe event ${event.type} (${event.id})`);
    } catch (error) {
      await this.stripeEvents.markError(eventRowId, String(error));
      this.logger.error(
        `Failed to process Stripe event ${event.id}: ${String(error)}`,
      );
      throw error; // let BullMQ retry
    }
  }

  private dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentSucceeded.execute(event);
      case 'payment_intent.payment_failed':
        return this.handlePaymentFailed.execute(event);
      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted.execute(event);
      case 'invoice.upcoming':
        return this.handleInvoiceUpcoming.execute(event);
      // Step 21 — paying by card (Stripe Checkout).
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted.execute(event);
      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdated.execute(event);
      case 'invoice.created':
        return this.handleInvoiceCreated.execute(event);
      default:
        this.logger.info(
          `Stripe event ${event.type} (${event.id}) has no handler — stored only`,
        );
        return Promise.resolve();
    }
  }
}
