import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EmailService } from '../../email/email.service';
import { EmailLocale } from '../../email/templates/invite-employee.template';
import { passwordResetTemplate } from '../../email/templates/password-reset.template';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';

/**
 * `POST /api/auth/forgot-password` — `@Public()`, rate-limited hard. Same
 * response whether the email exists or not (doc/notes/Phaces/02-auth-users.md).
 */
@Injectable()
export class ForgotPasswordHandler {
  constructor(
    @InjectPinoLogger(ForgotPasswordHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly codes: OneTimeCodesService,
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);

    if (user) {
      const code = await this.codes.generate('password_reset', {
        userId: user.id,
      });
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });
      const { subject, html } = passwordResetTemplate(
        code,
        (tenant?.locale as EmailLocale) ?? 'en',
      );
      await this.email.send(email, subject, html);
      this.logger.info(`Password reset code sent to user ${user.id}`);
    } else {
      this.logger.debug(`Password reset requested for unknown email ${email}`);
    }

    return { sent: true };
  }
}
