import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { env } from '../config/env.config';
import { resend } from '../config/resend.config';

/** The only place in the app that calls Resend. Every module sends mail through this. */
@Injectable()
export class EmailService {
  constructor(
    @InjectPinoLogger(EmailService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * `attachments`: `{ filename, content }[]` where `content` is a base64
   * string — matches Resend SDK's own `Attachment` interface
   * (`node_modules/resend/dist/index.d.cts`, `content?: string | Buffer`).
   * Step 15 is the first caller: the frozen quote/invoice PDF on
   * `client_quote_sent`/`client_invoice_sent`.
   */
  async send(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; content: string }[],
  ): Promise<void> {
    const { error } = await resend.emails.send({
      from: env.EMAIL,
      to,
      subject,
      html,
      ...(attachments && attachments.length > 0 && { attachments }),
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new BadGatewayException('Failed to send email');
    }
    this.logger.info(`Email sent to ${to}: ${subject}`);
  }
}
