import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toSupplierEntity } from '../helpers/supplier.helper';
import { SupplierRepository } from '../repositories/supplier.repository';

/**
 * `DELETE /api/suppliers/:id` — sets `is_active = false`. Never a hard
 * delete: purchase invoices point at this row.
 */
@Injectable()
export class ArchiveSupplierHandler {
  constructor(
    @InjectPinoLogger(ArchiveSupplierHandler.name)
    private readonly logger: PinoLogger,
    private readonly suppliers: SupplierRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Archiving supplier ${id}`);

    const current = await this.suppliers.findById(id);
    if (!current) {
      this.logger.warn(`Cannot archive supplier: ${id} not found`);
      throw new NotFoundException('Supplier not found');
    }

    const updated = await this.suppliers.setActive(id, false);
    const entity = toSupplierEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'archive',
      entityType: 'supplier',
      entityId: id,
      oldValue: toSupplierEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Supplier archived: ${id}`);
    return entity;
  }
}
