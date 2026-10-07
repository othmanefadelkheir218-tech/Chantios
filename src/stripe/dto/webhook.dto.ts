import Stripe from 'stripe';

export const STRIPE_WEBHOOKS_QUEUE = 'stripe-webhooks';

/**
 * One BullMQ job: an event already stored in `stripe_events` (synchronously,
 * in the webhook request — see `RecordWebhookEventHandler`) and its row id.
 * `StripeWebhookProcessor` takes it off the queue and hands it to
 * `ProcessWebhookHandler`, which dispatches it by type and marks the row
 * processed/errored. Stripe's own `Stripe.Event` type is typed enough — no
 * extra validation to express here.
 */
export interface WebhookJobData {
  eventRowId: number;
  event: Stripe.Event;
}
