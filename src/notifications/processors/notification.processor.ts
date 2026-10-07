import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../../email/email.service';
import { EmailJob } from '../handlers/dispatch-notification.handler';
import { NOTIFICATIONS_QUEUE } from '../notification.types';

/**
 * The BullMQ worker of the `notifications` queue: sends one email per job.
 * By the time a job exists, the in-app row is saved and the socket event is
 * sent — so a provider that is down fails (and retries) THIS job only; the
 * user still sees the notification in the app.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  constructor(private readonly email: EmailService) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    const { to, subject, html, attachment } = job.data;
    if (attachment) {
      await this.email.send(to, subject, html, [attachment]);
    } else {
      await this.email.send(to, subject, html);
    }
  }
}
