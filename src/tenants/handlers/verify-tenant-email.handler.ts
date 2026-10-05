import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { VerifyTenantEmailDto } from '../dto/verify-tenant-email.dto';
import { toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class VerifyTenantEmailHandler {
  constructor(
    @InjectPinoLogger(VerifyTenantEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly codes: OneTimeCodesService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: VerifyTenantEmailDto, actor: RequestActor) {
    this.logger.info(`Verifying email for tenant ${id}`);

    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      this.logger.warn(`Cannot verify email: tenant ${id} not found`);
      throw new NotFoundException('Tenant not found');
    }
    if (tenant.emailVerifiedAt) {
      throw new BadRequestException('Email already verified');
    }

    const ok = await this.codes.verify(
      'email_verification',
      { tenantId: id },
      dto.code,
    );
    if (!ok) {
      throw new BadRequestException('Invalid or expired code');
    }

    const updated = await this.tenants.setEmailVerified(id);

    await this.audit.write({
      tenantId: id,
      adminUserId: actor.adminUserId,
      action: 'verify_email',
      entityType: 'tenant',
      entityId: id,
      oldValue: { email_verified_at: null },
      newValue: { email_verified_at: updated.emailVerifiedAt },
      ipAddress: actor.ip,
    });
    this.logger.info(`Tenant ${id} email verified`);
    return toTenantEntity(updated);
  }
}
