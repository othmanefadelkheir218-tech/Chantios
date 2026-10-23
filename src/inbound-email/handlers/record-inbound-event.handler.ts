import { Injectable } from '@nestjs/common';
import { InboundEmailEvent, Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { EmailReceivedEvent } from 'resend';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import { InboundEmailEventRepository } from '../repositories/inbound-email-event.repository';

/**
 * The idempotency gate, like Stripe's: the notice is stored in Postgres
 * BEFORE anything is queued, in the webhook request. `resend_email_id`
 * (UNIQUE) makes a second delivery of the same email a no-op.
 */
@Injectable()
export class RecordInboundEventHandler {
  constructor(
    @InjectPinoLogger(RecordInboundEventHandler.name)
    private readonly logger: PinoLogger,
    private readonly events: InboundEmailEventRepository,
  ) {}

  async execute(
    event: EmailReceivedEvent,
  ): Promise<{ row: InboundEmailEvent; isNew: boolean }> {
    const resendEmailId = event.data.email_id;
    try {
      const row = await this.events.create({
        resendEmailId,
        payload: event as unknown as Prisma.InputJsonValue,
      });
      return { row, isNew: true };
    } catch (error: unknown) {
      if (!isUniqueViolation(error)) throw error;
      const row = await this.events.findByResendId(resendEmailId);
      if (!row) throw error;
      this.logger.info(`Inbound email ${resendEmailId} already on file`);
      return { row, isNew: false };
    }
  }
}
