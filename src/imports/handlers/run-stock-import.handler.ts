import { Injectable } from '@nestjs/common';
import { ImportBatch, Material, Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { ActingParty } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { normalizeDescription } from '../../materials/helpers/material.helper';
import { MaterialsService } from '../../materials/materials.service';
import { ImportedMovement } from '../../stock/handlers/record-imported-movements.handler';
import { StockService } from '../../stock/stock.service';
import { StockImportRowDto } from '../dto/stock-import-row.dto';
import { ImportError, importErrors } from '../helpers/import-error.helper';
import { ImportBatchRepository } from '../repositories/import-batch.repository';
import { IMPORT_TRANSACTION, ImportRunResult } from './run-import.types';

/**
 * Runs a stock file (doc/notes/bulk-import.md § Stock import): purchases and
 * adjustments only, at the material's current `purchase_price`. Checks every
 * row first and collects ALL the errors. Any error → nothing is written. No
 * error → one transaction with every movement, each carrying
 * `import_batch_id`, and the batch marked `done`. The same material may come
 * back on several lines — each line is one movement.
 */
@Injectable()
export class RunStockImportHandler {
  constructor(
    @InjectPinoLogger(RunStockImportHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly batches: ImportBatchRepository,
    private readonly materials: MaterialsService,
    private readonly stock: StockService,
  ) {}

  async execute(
    batch: ImportBatch,
    actor: ActingParty,
  ): Promise<ImportRunResult> {
    const rows = batch.rows as unknown as StockImportRowDto[];
    const { byId } = await this.materials.loadForImport(
      rows.map((row) => row.id),
      [],
    );
    const { errors, movements } = this.check(rows, byId);
    if (errors.length > 0) {
      this.logger.info(
        `Import batch ${batch.id}: ${errors.length} errors, nothing written`,
      );
      return { status: 'failed', errors };
    }

    await this.tenantPrisma.db.$transaction(async (tx) => {
      await this.stock.recordImportedMovements(movements, batch.id, actor, tx);
      await this.batches.update(
        batch.id,
        {
          status: 'done',
          finishedAt: new Date(),
          createdCount: movements.length,
          updatedCount: 0,
          errors: Prisma.DbNull,
        },
        tx,
      );
    }, IMPORT_TRANSACTION);

    return {
      status: 'done',
      createdCount: movements.length,
      updatedCount: 0,
      touchedMaterialIds: [...new Set(movements.map((m) => m.material.id))],
    };
  }

  private check(rows: StockImportRowDto[], byId: Material[]) {
    const errors: ImportError[] = [];
    const movements: ImportedMovement[] = [];
    const materialById = new Map(byId.map((m) => [m.id, m]));

    for (const row of rows) {
      const rowErrors: ImportError[] = [];
      const material = materialById.get(row.id);
      if (!material) {
        rowErrors.push(importErrors.idNotFound(row.row, row.id));
      } else if (!material.isActive) {
        rowErrors.push(
          importErrors.idArchived(row.row, row.id, material.description),
        );
      } else if (
        normalizeDescription(material.description) !==
        normalizeDescription(row.description)
      ) {
        rowErrors.push(
          importErrors.descriptionMismatch(
            row.row,
            row.id,
            material.description,
          ),
        );
      }

      const quantity = Number(row.quantity);
      if (row.type === 'purchase' && quantity <= 0) {
        rowErrors.push(importErrors.purchaseNotPositive(row.row));
      }
      if (row.type === 'adjustment') {
        if (quantity === 0)
          rowErrors.push(importErrors.adjustmentZero(row.row));
        if (!row.note?.trim()) {
          rowErrors.push(importErrors.adjustmentNoNote(row.row));
        }
      }

      if (rowErrors.length === 0 && material) {
        movements.push({
          material,
          type: row.type,
          quantity: row.quantity,
          movementDate: row.movement_date ?? undefined,
          note: row.note ?? null,
        });
      }
      errors.push(...rowErrors);
    }
    return { errors, movements };
  }
}
