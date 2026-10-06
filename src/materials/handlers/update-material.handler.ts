import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateMaterialDto } from '../dto/update-material.dto';
import {
  assertNonNegative,
  toMaterialEntity,
} from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/**
 * `PATCH /api/materials/:id`. A `purchase_price` change here never shifts a
 * past `stock_movements.unit_price` — each movement already froze its own
 * price at creation. Only future movements default to the new price.
 */
@Injectable()
export class UpdateMaterialHandler {
  constructor(
    @InjectPinoLogger(UpdateMaterialHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateMaterialDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating material ${id}`);

    const current = await this.materials.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update material: ${id} not found`);
      throw new NotFoundException('Material not found');
    }
    if (dto.purchase_price !== undefined) {
      assertNonNegative(dto.purchase_price, 'purchase_price');
    }
    if (dto.minimum_stock !== undefined) {
      assertNonNegative(dto.minimum_stock, 'minimum_stock');
    }

    const updated = await this.materials.update(id, {
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.purchase_price !== undefined && {
        purchasePrice: dto.purchase_price,
      }),
      ...(dto.minimum_stock !== undefined && {
        minimumStock: dto.minimum_stock,
      }),
    });
    const entity = toMaterialEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'material',
      entityId: id,
      oldValue: toMaterialEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Material updated: ${id}`);
    return entity;
  }
}
