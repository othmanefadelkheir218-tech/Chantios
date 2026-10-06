import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MaterialsService } from '../../materials/materials.service';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import {
  assertNonZeroQuantity,
  toMovementEntity,
} from '../helpers/stock.helper';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { CheckCoverageHandler } from './check-coverage.handler';

/**
 * `POST /api/stock/adjustment` — admin/manager only (enforced by `@Roles`
 * on the controller). Either sign, never 0, `note` required. The only way
 * to fix a mistake in the ledger — never an update/delete of a past row.
 * `unit_price` always freezes from `materials.purchase_price`; the DTO has
 * no override field for it (unlike a purchase).
 */
@Injectable()
export class RecordAdjustmentHandler {
  constructor(
    @InjectPinoLogger(RecordAdjustmentHandler.name)
    private readonly logger: PinoLogger,
    private readonly movements: StockMovementRepository,
    private readonly materials: MaterialsService,
    private readonly checkCoverage: CheckCoverageHandler,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: AdjustStockDto, actor: AuthenticatedUser) {
    this.logger.info(`Recording adjustment of material ${dto.material_id}`);
    assertNonZeroQuantity(dto.quantity);

    const material = await this.materials.findByIdRaw(dto.material_id);
    if (!material) {
      this.logger.warn(
        `Cannot record adjustment: material ${dto.material_id} not found`,
      );
      throw new NotFoundException('Material not found');
    }

    const created = await this.movements.create({
      tenantId: actor.tenantId,
      materialId: dto.material_id,
      projectId: dto.project_id ?? null,
      type: 'adjustment',
      quantity: dto.quantity,
      unitPrice: material.purchasePrice,
      note: dto.note,
      createdBy: actor.userId,
    });
    const entity = toMovementEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'adjustment',
      entityType: 'stock_movement',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(
      `Adjustment recorded: movement ${created.id}, material ${dto.material_id}, qty ${dto.quantity}`,
    );

    // A positive adjustment can also cover a shortfall, same as a purchase —
    // run the same soft coverage check.
    if (Number(dto.quantity) > 0) {
      await this.checkCoverage.execute(dto.material_id);
    }
    return entity;
  }
}
