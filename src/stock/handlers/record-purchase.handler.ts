import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MaterialsService } from '../../materials/materials.service';
import { CreateMovementDto } from '../dto/create-movement.dto';
import {
  assertPositiveQuantity,
  toMovementEntity,
} from '../helpers/stock.helper';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { CheckCoverageHandler } from './check-coverage.handler';

/**
 * `POST /api/stock/purchase` — `quantity` positive, `project_id` always
 * `NULL` (the DTO has no such field at all). `unit_price` freezes from
 * `materials.purchase_price` at this moment unless the caller supplies one.
 * Then runs the (soft, non-blocking) coverage check.
 */
@Injectable()
export class RecordPurchaseHandler {
  constructor(
    @InjectPinoLogger(RecordPurchaseHandler.name)
    private readonly logger: PinoLogger,
    private readonly movements: StockMovementRepository,
    private readonly materials: MaterialsService,
    private readonly checkCoverage: CheckCoverageHandler,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateMovementDto, actor: AuthenticatedUser) {
    this.logger.info(`Recording purchase of material ${dto.material_id}`);
    assertPositiveQuantity(dto.quantity);

    const material = await this.materials.findByIdRaw(dto.material_id);
    if (!material) {
      this.logger.warn(
        `Cannot record purchase: material ${dto.material_id} not found`,
      );
      throw new NotFoundException('Material not found');
    }

    const unitPrice = dto.unit_price ?? material.purchasePrice.toString();
    const created = await this.movements.create({
      tenantId: actor.tenantId,
      materialId: dto.material_id,
      projectId: null,
      purchaseInvoiceId: dto.purchase_invoice_id ?? null,
      type: 'purchase',
      quantity: dto.quantity,
      unitPrice,
      ...(dto.movement_date && { movementDate: new Date(dto.movement_date) }),
      note: dto.note ?? null,
      createdBy: actor.userId,
    });
    const entity = toMovementEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'purchase',
      entityType: 'stock_movement',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(
      `Purchase recorded: movement ${created.id}, material ${dto.material_id}, qty ${dto.quantity}`,
    );

    await this.checkCoverage.execute(dto.material_id);
    return entity;
  }
}
