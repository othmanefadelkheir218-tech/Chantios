import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  INBOUND_EMAIL_QUEUE,
  InboundEmailJobData,
} from '../dto/inbound-email-job.dto';
import { ProcessInboundEmailHandler } from '../handlers/process-inbound-email.handler';

/**
 * The BullMQ worker of the `inbound-email` queue. The controller already
 * checked the signature, stored the notice and answered `200`; this routes
 * the email, with BullMQ (not Resend) retrying when the handler throws.
 */
@Processor(INBOUND_EMAIL_QUEUE)
export class InboundEmailProcessor extends WorkerHost {
  constructor(
    private readonly processInboundEmail: ProcessInboundEmailHandler,
  ) {
    super();
  }

  async process(job: Job<InboundEmailJobData>): Promise<void> {
    await this.processInboundEmail.execute(
      job.data.eventRowId,
      job.data.resendEmailId,
    );
  }
}
