import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import {
  isSameTenant,
  toTenantData,
  toTenantEntity,
} from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class UpdateTenantHandler {
  constructor(
    @InjectPinoLogger(UpdateTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateTenantDto, actor: RequestActor) {
    this.logger.info(`Updating tenant ${id}`);

    const current = await this.tenants.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update tenant: ${id} not found`);
      throw new NotFoundException('Tenant not found');
    }

    const email = dto.email?.toLowerCase();
    if (email && email !== current.email) {
      if (await this.tenants.findByEmail(email)) {
        this.logger.warn(`Cannot update tenant: email ${email} already used`);
        throw new ConflictException(`Email ${email} is already used`);
      }
    }

    const updated = await this.tenants.update(id, toTenantData(dto));
    const entity = toTenantEntity(updated);
    const before = toTenantEntity(current);

    // Same values as before (an empty body, or the same data again): no history line.
    if (isSameTenant(before, entity)) {
      this.logger.info(`Tenant ${id}: nothing changed, no audit entry`);
      return entity;
    }

    await this.audit.write({
      tenantId: id,
      adminUserId: actor.adminUserId,
      action: 'update',
      entityType: 'tenant',
      entityId: id,
      oldValue: before,
      newValue: entity,
      ipAddress: actor.ip,
    });
    this.logger.info(`Tenant updated: ${id}`);
    return entity;
  }
}
