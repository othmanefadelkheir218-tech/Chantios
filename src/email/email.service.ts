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

  async send(to: string, subject: string, html: string): Promise<void> {
    const { error } = await resend.emails.send({
      from: env.EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new BadGatewayException('Failed to send email');
    }
    this.logger.info(`Email sent to ${to}: ${subject}`);
  }
}
