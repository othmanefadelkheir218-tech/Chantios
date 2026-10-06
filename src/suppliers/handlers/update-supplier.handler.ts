import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { toSupplierEntity } from '../helpers/supplier.helper';
import { SupplierRepository } from '../repositories/supplier.repository';

/** `PATCH /api/suppliers/:id` — a supplier is editable. */
@Injectable()
export class UpdateSupplierHandler {
  constructor(
    @InjectPinoLogger(UpdateSupplierHandler.name)
    private readonly logger: PinoLogger,
    private readonly suppliers: SupplierRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateSupplierDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating supplier ${id}`);

    const current = await this.suppliers.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update supplier: ${id} not found`);
      throw new NotFoundException('Supplier not found');
    }

    const updated = await this.suppliers.update(
      id,
      toCamelKeys<Prisma.SupplierUpdateInput>(dto),
    );
    const entity = toSupplierEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'supplier',
      entityId: id,
      oldValue: toSupplierEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Supplier updated: ${id}`);
    return entity;
  }
}
