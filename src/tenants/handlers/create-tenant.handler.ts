import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { toTenantData, toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';
import { PrepareTaxFieldsHandler } from './prepare-tax-fields.handler';

@Injectable()
export class CreateTenantHandler {
  constructor(
    @InjectPinoLogger(CreateTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
    private readonly taxFields: PrepareTaxFieldsHandler,
  ) {}

  /** `tx` — step 02 registration runs this inside its own transaction. */
  async execute(
    dto: CreateTenantDto,
    actor: RequestActor,
    tx?: Prisma.TransactionClient,
  ) {
    this.logger.info(`Creating tenant ${dto.email}`);

    const email = dto.email.toLowerCase();
    if (await this.tenants.findByEmail(email, tx)) {
      this.logger.warn(`Cannot create tenant: email ${email} already used`);
      throw new ConflictException(`Email ${email} is already used`);
    }

    // Step 27: active TVA country, TVA number normalized + VIES status
    // `pending` (asked by the caller after its transaction, or the retry job).
    const tax = await this.taxFields.execute(
      { country: dto.country, vatNumber: dto.vat_number },
      null,
    );
    const tenant = await this.tenants.create(
      { ...toTenantData(dto), ...tax } as Prisma.TenantCreateInput,
      tx,
    );
    const entity = toTenantEntity(tenant);

    await this.audit.write(
      {
        tenantId: tenant.id,
        adminUserId: actor.adminUserId,
        action: 'create',
        entityType: 'tenant',
        entityId: tenant.id,
        newValue: entity,
        ipAddress: actor.ip,
      },
      tx,
    );
    this.logger.info(`Tenant created: ${tenant.id}`);
    return entity;
  }
}
