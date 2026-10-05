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
export class RestoreTenantHandler {
  constructor(
    @InjectPinoLogger(RestoreTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: RequestActor) {
    this.logger.info(`Restoring tenant ${id}`);

    const current = await this.tenants.findByIdIncludingDeleted(id);
    if (!current) {
      this.logger.warn(`Cannot restore: tenant ${id} not found`);
      throw new NotFoundException('Tenant not found');
    }
    if (!current.deletedAt) {
      throw new BadRequestException('Tenant is not deleted');
    }

    const updated = await this.tenants.restore(id);

    await this.audit.write({
      tenantId: id,
      adminUserId: actor.adminUserId,
      action: 'restore',
      entityType: 'tenant',
      entityId: id,
      oldValue: { deleted_at: current.deletedAt },
      newValue: { deleted_at: null },
      ipAddress: actor.ip,
    });
    this.logger.info(`Tenant ${id} restored`);
    return toTenantEntity(updated);
  }
}
