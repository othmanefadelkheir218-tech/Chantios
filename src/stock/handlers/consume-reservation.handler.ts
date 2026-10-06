import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { toReservationEntity } from '../helpers/stock.helper';
import { StockReservationRepository } from '../repositories/stock-reservation.repository';

/**
 * Lowers `remaining_quantity` only — `reserved_quantity` (the original ask)
 * never moves. At 0 → `status = 'consumed'`. Called by
 * `record-consumption.handler` after it writes the ledger row.
 *
 * No active reservation for this (project, material) pair is **not** an
 * error — real usage can include a material that was never part of the
 * recipe estimate (doc/notes/catalogue-stock-tables-and-cost-storage.md §
 * "Pre-fill gives speed, editing gives truth"). This is a no-op logged at
 * warn level, not a thrown exception.
 *
 * `tx` — step 09's `declare-materials` runs this inside its own transaction.
 * When a `tx` is given the audit row is NOT written here: the caller writes
 * its own after the transaction commits, so a rolled-back declaration never
 * leaves an audit trail for rows that do not exist.
 */
@Injectable()
export class ConsumeReservationHandler {
  constructor(
    @InjectPinoLogger(ConsumeReservationHandler.name)
    private readonly logger: PinoLogger,
    private readonly reservations: StockReservationRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    projectId: number,
    materialId: number,
    quantity: string,
    actor: AuthenticatedUser,
    tx?: TenantTransactionClient,
  ) {
    const updated = await this.reservations.decrementRemaining(
      projectId,
      materialId,
      quantity,
      tx,
    );
    if (!updated) {
      this.logger.warn(
        `No active reservation for project ${projectId} / material ${materialId} — consumption recorded with nothing to lower`,
      );
      return null;
    }

    const entity = toReservationEntity(updated);
    if (!tx) {
      await this.audit.write({
        tenantId: actor.tenantId,
        userId: actor.userId,
        action: 'consume_reservation',
        entityType: 'stock_reservation',
        entityId: updated.id,
        newValue: entity,
        ipAddress: null,
      });
    }
    this.logger.info(
      `Reservation ${updated.id} consumed by ${quantity}: remaining=${updated.remainingQuantity.toString()}, status=${updated.status}`,
    );
    return entity;
  }
}
