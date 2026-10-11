import { BadRequestException, Injectable } from '@nestjs/common';
import { Material } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { ActingParty } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import {
  assertNonZeroQuantity,
  assertPositiveQuantity,
} from '../helpers/stock.helper';
import { StockMovementRepository } from '../repositories/stock-movement.repository';

export interface ImportedMovement {
  /** The material row itself — a materials import passes rows created in the same transaction. */
  material: Pick<Material, 'id' | 'purchasePrice'>;
  type: 'purchase' | 'adjustment';
  quantity: string;
  movementDate?: string;
  note?: string | null;
}

/**
 * The movements of a bulk import (doc/notes/bulk-import.md § Stock import),
 * written inside the import's transaction with `import_batch_id`. Same rules
 * as the single routes: a purchase is positive and has no project, an
 * adjustment is never 0 and has a note, and `unit_price` always freezes from
 * the material's `purchase_price` — an import has no price column. Never a
 * consumption. The caller runs the coverage check once, after the commit.
 */
@Injectable()
export class RecordImportedMovementsHandler {
  constructor(
    @InjectPinoLogger(RecordImportedMovementsHandler.name)
    private readonly logger: PinoLogger,
    private readonly movements: StockMovementRepository,
  ) {}

  async execute(
    rows: ImportedMovement[],
    importBatchId: number,
    actor: ActingParty,
    tx: TenantTransactionClient,
  ): Promise<number> {
    for (const row of rows) {
      if (row.type === 'purchase') assertPositiveQuantity(row.quantity);
      else assertNonZeroQuantity(row.quantity);
      if (row.type === 'adjustment' && !row.note?.trim()) {
        throw new BadRequestException('An adjustment needs a note');
      }
    }

    const count = await this.movements.createMany(
      rows.map((row) => ({
        tenantId: actor.tenantId,
        materialId: row.material.id,
        projectId: null,
        type: row.type,
        quantity: row.quantity,
        unitPrice: row.material.purchasePrice,
        ...(row.movementDate && { movementDate: new Date(row.movementDate) }),
        note: row.note?.trim() || null,
        importBatchId,
        createdBy: actor.userId,
      })),
      tx,
    );
    this.logger.info(
      `Import batch ${importBatchId}: ${count} stock movements written`,
    );
    return count;
  }
}
