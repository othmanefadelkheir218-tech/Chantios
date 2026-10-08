import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EmailService } from '../../email/email.service';
import { EmailLocale } from '../../email/templates/invite-employee.template';
import { tenantEmailVerificationTemplate } from '../../email/templates/tenant-email-verification.template';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class SendTenantVerificationEmailHandler {
  constructor(
    @InjectPinoLogger(SendTenantVerificationEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly codes: OneTimeCodesService,
    private readonly email: EmailService,
  ) {}

  async execute(id: number): Promise<{ sent: true }> {
    this.logger.info(`Sending verification email for tenant ${id}`);

    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      this.logger.warn(
        `Cannot send verification email: tenant ${id} not found`,
      );
      throw new NotFoundException('Tenant not found');
    }
    if (tenant.emailVerifiedAt) {
      throw new BadRequestException('Email already verified');
    }

    const code = await this.codes.generate('email_verification', {
      tenantId: id,
    });
    const { subject, html } = tenantEmailVerificationTemplate(
      code,
      tenant.locale as EmailLocale,
    );
    await this.email.send(tenant.email, subject, html);

    this.logger.info(`Verification email sent for tenant ${id}`);
    return { sent: true };
  }
}
