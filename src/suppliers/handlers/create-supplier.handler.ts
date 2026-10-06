import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { toSupplierEntity } from '../helpers/supplier.helper';
import { SupplierRepository } from '../repositories/supplier.repository';

/** `POST /api/suppliers` — phone format is checked in the DTO, backed by the DB CHECK. */
@Injectable()
export class CreateSupplierHandler {
  constructor(
    @InjectPinoLogger(CreateSupplierHandler.name)
    private readonly logger: PinoLogger,
    private readonly suppliers: SupplierRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateSupplierDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating supplier ${dto.name}`);

    const created = await this.suppliers.create({
      ...toCamelKeys<Prisma.SupplierUncheckedCreateInput>(dto),
      tenantId: actor.tenantId,
      isActive: true,
    });
    const entity = toSupplierEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'supplier',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Supplier created: ${created.id}`);
    return entity;
  }
}
