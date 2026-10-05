import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { SetTenantStatusDto } from '../dto/suspend-tenant.dto';
import { toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class SetTenantStatusHandler {
  constructor(
    @InjectPinoLogger(SetTenantStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: SetTenantStatusDto, actor: RequestActor) {
    this.logger.info(`Setting tenant ${id} to ${dto.status}`);

    const current = await this.tenants.findById(id);
    if (!current) {
      this.logger.warn(`Cannot set status: tenant ${id} not found`);
      throw new NotFoundException('Tenant not found');
    }
    if (current.status === dto.status) {
      throw new BadRequestException(`Tenant is already ${dto.status}`);
    }

    const updated = await this.tenants.setStatus(id, dto.status);

    // TODO: step 02 — `suspended` and `banned` must also revoke the
    // refresh tokens of every user of this tenant.
    await this.audit.write({
      tenantId: id,
      adminUserId: actor.adminUserId,
      action: 'set_status',
      entityType: 'tenant',
      entityId: id,
      oldValue: { status: current.status },
      newValue: { status: updated.status, reason: dto.reason ?? null },
      ipAddress: actor.ip,
    });
    this.logger.info(`Tenant ${id}: ${current.status} -> ${updated.status}`);
    return toTenantEntity(updated);
  }
}
