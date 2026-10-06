import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { MaterialsService } from '../../materials/materials.service';
import {
  assertPositiveQuantity,
  toMovementEntity,
} from '../helpers/stock.helper';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { ConsumeReservationHandler } from './consume-reservation.handler';

/**
 * No HTTP route of its own — step 09's `declare-materials` (site reports)
 * calls this, through `StockService`, never this handler directly. It is the
 * only way stock leaves.
 *
 * `quantity` is the POSITIVE amount actually used (what a site report
 * captures — "3 L of paint used"), not the signed ledger value. This handler
 * negates it before writing the movement, so the sign convention
 * (`stock_movements.quantity < 0` for `consumption`) stays internal to the
 * stock module. The negation is done with `Prisma.Decimal`, never a JS
 * `Number`, so `0.1`-style quantities are exact.
 *
 * `tx` — `declare-materials` writes every item of a declaration inside one
 * transaction (a failure on item 3 leaves nothing of items 1 and 2). When a
 * `tx` is given, the audit rows are NOT written here (see
 * `consume-reservation.handler.ts`): the caller audits after commit.
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
    tx?: TenantTransactionClient,
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
    const signedQuantity = new Prisma.Decimal(input.quantity)
      .abs()
      .negated()
      .toString();

    const created = await this.movements.create(
      {
        tenantId: actor.tenantId,
        materialId: input.materialId,
        projectId: input.projectId,
        reportId: input.reportId,
        type: 'consumption',
        quantity: signedQuantity,
        unitPrice,
        createdBy: actor.userId,
      },
      tx,
    );
    const entity = toMovementEntity(created);

    if (!tx) {
      await this.audit.write({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'consumption',
        entityType: 'stock_movement',
        entityId: created.id,
        newValue: entity,
        ipAddress: null,
      });
    }
    this.logger.info(
      `Consumption recorded: movement ${created.id}, material ${input.materialId}, project ${input.projectId}`,
    );

    await this.consumeReservation.execute(
      input.projectId,
      input.materialId,
      input.quantity,
      actor,
      tx,
    );
    return entity;
  }
}
