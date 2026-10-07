import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { STRIPE_WEBHOOKS_QUEUE, WebhookJobData } from '../dto/webhook.dto';
import { ProcessWebhookHandler } from '../handlers/process-webhook.handler';

/**
 * The BullMQ worker of the `stripe-webhooks` queue. The controller already
 * verified the signature, stored the event (`RecordWebhookEventHandler`) and
 * responded `{ received: true }` — this is what dispatches it, with BullMQ
 * retrying this job (not Stripe) when `ProcessWebhookHandler` throws.
 */
@Processor(STRIPE_WEBHOOKS_QUEUE)
export class StripeWebhookProcessor extends WorkerHost {
  constructor(private readonly processWebhook: ProcessWebhookHandler) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    await this.processWebhook.execute(job.data.eventRowId, job.data.event);
  }
}
