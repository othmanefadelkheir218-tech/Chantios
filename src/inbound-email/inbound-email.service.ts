import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { WebhookEventPayload } from 'resend';
import { env } from '../config/env.config';
import { resend } from '../config/resend.config';

interface SignatureHeaders {
  id?: string;
  timestamp?: string;
  signature?: string;
}

@Injectable()
export class InboundEmailService {
  constructor(
    @InjectPinoLogger(InboundEmailService.name)
    private readonly logger: PinoLogger,
  ) {}

  /** Rejects any call that is not signed by Resend with our webhook secret. */
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
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /** The webhook only carries a notice — the body comes from a second API call. */
  async logReceived(event: WebhookEventPayload): Promise<void> {
    if (event.type !== 'email.received') {
      this.logger.info({ type: event.type }, 'Resend webhook ignored (test)');
      return;
    }
    const { data, error } = await resend.emails.receiving.get(
      event.data.email_id,
    );
    if (error || !data) {
      this.logger.error({ error }, 'Resend inbound email fetch failed (test)');
      return;
    }
    this.logger.info(
      {
        from: data.from,
        to: data.to,
        subject: data.subject,
        messageId: data.message_id,
        inReplyTo: data.headers?.['in-reply-to'] ?? null,
        references: data.headers?.['references'] ?? null,
        text: data.text,
        htmlLength: data.html?.length ?? 0,
        attachments: data.attachments.map((a) => ({
          filename: a.filename,
          contentType: a.content_type,
          size: a.size,
        })),
      },
      'Resend inbound email received (test)',
    );
  }
}
