import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MaterialsService } from '../../materials/materials.service';
import {
  assertPositiveQuantity,
  toMovementEntity,
} from '../helpers/stock.helper';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { ConsumeReservationHandler } from './consume-reservation.handler';

/**
 * Built here, **no HTTP route** — only step 09 (site reports, not built
 * yet) calls this, through `StockService`, never this handler directly.
 *
 * JUDGMENT CALL on the input shape, since step 09 doesn't exist to dictate
 * it: `quantity` here is the POSITIVE amount actually used (what a site
 * report would naturally capture — "3 L of paint used"), not the signed
 * ledger value. This handler negates it before writing the movement, so the
 * sign convention (`stock_movements.quantity < 0` for `consumption`) stays
 * internal to the stock module. If step 09's real shape differs, adapt at
 * the call site, not this handler's contract.
 */
@Injectable()
export class RecordConsumptionHandler {
  constructor(
    @InjectPinoLogger(RecordConsumptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly movements: StockMovementRepository,
    private readonly materials: MaterialsService,
    private readonly consumeReservation: ConsumeReservationHandler,
    private readonly audit: AuditService,
  ) {}

  async execute(
    input: {
      materialId: number;
      projectId: number;
      reportId: number;
      quantity: string;
      unitPrice?: string;
    },
    actor: AuthenticatedUser,
  ) {
    this.logger.info(
      `Recording consumption of material ${input.materialId} on project ${input.projectId}`,
    );
    assertPositiveQuantity(input.quantity);

    const material = await this.materials.findByIdRaw(input.materialId);
    if (!material) {
      this.logger.warn(
        `Cannot record consumption: material ${input.materialId} not found`,
      );
      throw new NotFoundException('Material not found');
    }

    const unitPrice = input.unitPrice ?? material.purchasePrice.toString();
    const signedQuantity = (-Math.abs(Number(input.quantity))).toString();

    const created = await this.movements.create({
      tenantId: actor.tenantId,
      materialId: input.materialId,
      projectId: input.projectId,
      reportId: input.reportId,
      type: 'consumption',
      quantity: signedQuantity,
      unitPrice,
      createdBy: actor.userId,
    });
    const entity = toMovementEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'consumption',
      entityType: 'stock_movement',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(
      `Consumption recorded: movement ${created.id}, material ${input.materialId}, project ${input.projectId}`,
    );

    await this.consumeReservation.execute(
      input.projectId,
      input.materialId,
      input.quantity,
      actor,
    );
    return entity;
  }
}
