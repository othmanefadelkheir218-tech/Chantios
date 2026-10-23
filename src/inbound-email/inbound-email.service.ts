import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { WebhookEventPayload } from 'resend';
import { env } from '../config/env.config';
import { resend } from '../config/resend.config';
import {
  INBOUND_EMAIL_QUEUE,
  InboundEmailJobData,
} from './dto/inbound-email-job.dto';
import { RecordInboundEventHandler } from './handlers/record-inbound-event.handler';

interface SignatureHeaders {
  id?: string;
  timestamp?: string;
  signature?: string;
}

/**
 * The Resend inbound webhook (doc/notes/client-email.md § Security): check
 * the Svix signature, store the notice once, queue it. The email itself is
 * fetched and routed by the worker (`ProcessInboundEmailHandler`).
 */
@Injectable()
export class InboundEmailService {
  constructor(
    @InjectPinoLogger(InboundEmailService.name)
    private readonly logger: PinoLogger,
    @InjectQueue(INBOUND_EMAIL_QUEUE)
    private readonly queue: Queue<InboundEmailJobData>,
    private readonly recordInboundEvent: RecordInboundEventHandler,
  ) {}

  /** Refuses any call that is not signed by Resend with our webhook secret. */
  verifyEvent(
    rawBody: Buffer | undefined,
    headers: SignatureHeaders,
  ): WebhookEventPayload {
    const { id, timestamp, signature } = headers;
    if (
      !env.RESEND_WEBHOOK_SECRET ||
      !rawBody ||
      !id ||
      !timestamp ||
      !signature
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }
    try {
      return resend.webhooks.verify({
        payload: rawBody.toString('utf8'),
        headers: { id, timestamp, signature },
        webhookSecret: env.RESEND_WEBHOOK_SECRET,
      });
    } catch {
      this.logger.warn('Resend webhook refused: wrong signature');
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Stored in Postgres BEFORE the `200`, then queued. A second delivery of
   * the same email is stored once and never queued again. Only the queue
   * step is best effort: the notice stays on file for a replay.
   */
  async recordAndEnqueue(event: WebhookEventPayload): Promise<void> {
    if (event.type !== 'email.received') {
      this.logger.info(`Resend webhook ${event.type} ignored`);
      return;
    }
    const { row, isNew } = await this.recordInboundEvent.execute(event);
    if (!isNew) return;
    try {
      await this.queue.add(
        'process',
        { eventRowId: row.id, resendEmailId: row.resendEmailId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.info(`Queued inbound email ${row.resendEmailId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Stored inbound email ${row.resendEmailId} but could not queue it: ${String(error)}`,
      );
    }
  }
}
