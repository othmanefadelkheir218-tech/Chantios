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
import { AppEventsService } from '../../common/events/app-events.service';
import { CheckVatNumberHandler } from './check-vat-number.handler';
import { PrepareTaxFieldsHandler } from './prepare-tax-fields.handler';
import { taxProfileChanged } from '../helpers/tenant.helper';

@Injectable()
export class UpdateTenantHandler {
  constructor(
    @InjectPinoLogger(UpdateTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
    private readonly taxFields: PrepareTaxFieldsHandler,
    private readonly checkVatNumber: CheckVatNumberHandler,
    private readonly events: AppEventsService,
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

    const tax = await this.taxFields.execute(
      { country: dto.country, vatNumber: dto.vat_number },
      current,
    );
    let updated = await this.tenants.update(id, {
      ...toTenantData(dto),
      ...tax,
    });
    // Step 27: a new TVA number is asked to VIES now; a new country or number
    // changes the TVA from the next invoice (billing re-syncs Stripe).
    if (taxProfileChanged(current, updated)) {
      updated = (await this.checkVatNumber.execute(id, false)) ?? updated;
      this.events.emit('tenant.tax_profile_changed', { tenantId: id });
    }
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
