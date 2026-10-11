import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateTenantProfileDto } from '../dto/update-tenant-profile.dto';
import {
  isSameTenant,
  toTenantEntity,
  toTenantProfileData,
} from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

/**
 * `PATCH /api/tenant` (route in `company-profile`) — `settings` module,
 * `can_edit`. The tenant is the caller's own (from the JWT). Writes `audit_logs` with the old and new values;
 * nothing changed → no audit line.
 */
@Injectable()
export class UpdateTenantProfileHandler {
  constructor(
    @InjectPinoLogger(UpdateTenantProfileHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    dto: UpdateTenantProfileDto,
    actor: AuthenticatedUser,
    ip: string | null,
  ) {
    const tenantId = actor.tenantId;
    this.logger.info(
      `User ${actor.userId} updating the profile of tenant ${tenantId}`,
    );

    const current = await this.tenants.findById(tenantId);
    if (!current) {
      this.logger.warn(
        `Cannot update company profile: tenant ${tenantId} not found`,
      );
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.tenants.update(
      tenantId,
      toTenantProfileData(dto),
    );
    const before = toTenantEntity(current);
    const after = toTenantEntity(updated);

    if (isSameTenant(before, after)) {
      this.logger.info(
        `Tenant ${tenantId} profile: nothing changed, no audit entry`,
      );
    } else {
      await this.audit.write({
        tenantId,
        userId: actor.userId,
        action: 'update',
        entityType: 'tenant',
        entityId: tenantId,
        oldValue: before,
        newValue: after,
        ipAddress: ip,
      });
      this.logger.info(`Tenant ${tenantId} profile updated`);
    }

    return after;
  }
}
