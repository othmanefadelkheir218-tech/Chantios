import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class SoftDeleteTenantHandler {
  constructor(
    @InjectPinoLogger(SoftDeleteTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: RequestActor) {
    this.logger.info(`Soft deleting tenant ${id}`);

    const current = await this.tenants.findByIdIncludingDeleted(id);
    if (!current) {
      this.logger.warn(`Cannot soft delete: tenant ${id} not found`);
      throw new NotFoundException('Tenant not found');
    }
    if (current.deletedAt) {
      throw new BadRequestException('Tenant is already deleted');
    }

    const updated = await this.tenants.softDelete(id);

    await this.audit.write({
      tenantId: id,
      adminUserId: actor.adminUserId,
      action: 'soft_delete',
      entityType: 'tenant',
      entityId: id,
      oldValue: { deleted_at: null },
      newValue: { deleted_at: updated.deletedAt },
      ipAddress: actor.ip,
    });
    this.logger.info(`Tenant ${id} soft deleted`);
    return toTenantEntity(updated);
  }
}
