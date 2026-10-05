import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { toTenantData, toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class CreateTenantHandler {
  constructor(
    @InjectPinoLogger(CreateTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
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

    const tenant = await this.tenants.create(
      toTenantData(dto) as Prisma.TenantCreateInput,
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
