import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { StripeEventRepository } from '../repositories/stripe-event.repository';
import { HandleInvoiceUpcomingHandler } from './handle-invoice-upcoming.handler';
import { HandlePaymentFailedHandler } from './handle-payment-failed.handler';
import { HandlePaymentSucceededHandler } from './handle-payment-succeeded.handler';
import { HandleSubscriptionDeletedHandler } from './handle-subscription-deleted.handler';

/**
 * Dispatches an ALREADY-STORED Stripe event by type (the storing + the
 * idempotency check happened synchronously in `RecordWebhookEventHandler`,
 * before this was ever queued — see its doc comment). Marks the row
 * processed on success, or records the error and re-throws so BullMQ retries
 * this job — never re-inserts the row.
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
  ) {}

  async execute(eventRowId: number, event: Stripe.Event): Promise<void> {
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
      default:
        this.logger.info(
          `Stripe event ${event.type} (${event.id}) has no handler — stored only`,
        );
        return Promise.resolve();
    }
  }
}
