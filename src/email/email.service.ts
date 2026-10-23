import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { env } from '../config/env.config';
import { resend } from '../config/resend.config';
import { formatAddress, threadHeaders } from './helpers/email-mime.helper';
import { htmlToText } from './helpers/html-to-text.helper';

/** A client email sent in a thread (step 25, doc/notes/client-email.md). */
export interface ThreadedEmail {
  fromName: string;
  fromAddress: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  inReplyTo?: string | null;
  references?: string[];
  /** Files already hosted (ImageKit): Resend downloads them from `path`. */
  attachments?: { filename: string; path: string; contentType: string }[];
}

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
      text: htmlToText(html),
      ...(attachments && attachments.length > 0 && { attachments }),
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new BadGatewayException('Failed to send email');
    }
    this.logger.info(`Email sent to ${to}: ${subject}`);
  }

  /**
   * A client email from the company address (step 25): our company name in
   * `From`, the topic's reply address in `Reply-To`, and the thread headers.
   * We never set our own `Message-ID` — Resend replaces it.
   */
  async sendThreaded(email: ThreadedEmail): Promise<{ resendEmailId: string }> {
    const headers = threadHeaders(email.inReplyTo, email.references);
    const { data, error } = await resend.emails.send({
      from: formatAddress(email.fromAddress, email.fromName),
      to: email.to,
      ...(email.cc && email.cc.length > 0 && { cc: email.cc }),
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo && { replyTo: email.replyTo }),
      ...(Object.keys(headers).length > 0 && { headers }),
      ...(email.attachments &&
        email.attachments.length > 0 && { attachments: email.attachments }),
    });
    if (error || !data) {
      this.logger.error(
        `Failed to send client email to ${email.to.join(', ')}: ${error?.message ?? 'no id'}`,
      );
      throw new BadGatewayException('Failed to send email');
    }
    this.logger.info(
      `Client email sent to ${email.to.join(', ')} (${data.id})`,
    );
    return { resendEmailId: data.id };
  }
}
