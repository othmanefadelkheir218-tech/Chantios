import { Injectable } from '@nestjs/common';
import { ImportBatch, Material, Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { ActingParty } from '../../auth/decorators/current-user.decorator';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import {
  MaterialImportCreate,
  MaterialImportUpdate,
} from '../../materials/handlers/import-materials.handler';
import { normalizeDescription } from '../../materials/helpers/material.helper';
import { MaterialsService } from '../../materials/materials.service';
import { StockService } from '../../stock/stock.service';
import { MaterialImportRowDto } from '../dto/material-import-row.dto';
import { ImportError, importErrors } from '../helpers/import-error.helper';
import { ImportBatchRepository } from '../repositories/import-batch.repository';
import { IMPORT_TRANSACTION, ImportRunResult } from './run-import.types';

const STOCK_INITIAL_NOTE = 'Stock initial';

type TakenName = { id: number; description: string; isActive: boolean };

/**
 * Runs a materials file (doc/notes/bulk-import.md § Materials import).
 * Checks every row first and collects ALL the errors. Any error → nothing is
 * written. No error → one transaction: create the new materials, update
 * `purchase_price` / `minimum_stock` of the existing ones, write one
 * `Stock initial` adjustment per `stock_depart`, mark the batch `done`.
 */
@Injectable()
export class RunMaterialsImportHandler {
  constructor(
    @InjectPinoLogger(RunMaterialsImportHandler.name)
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
    const rows = batch.rows as unknown as MaterialImportRowDto[];
    const { byId, taken } = await this.materials.loadForImport(
      rows.flatMap((row) => (row.id != null ? [row.id] : [])),
      rows
        .filter((row) => row.id == null)
        .map((row) => normalizeDescription(row.description)),
    );
    const plan = this.check(rows, byId, taken);
    if (plan.errors.length > 0) {
      this.logger.info(
        `Import batch ${batch.id}: ${plan.errors.length} errors, nothing written`,
      );
      return { status: 'failed', errors: plan.errors };
    }

    try {
      const created = await this.tenantPrisma.db.$transaction(async (tx) => {
        const createdRows = await this.materials.writeImport(
          plan.creates.map((c) => c.data),
          plan.updates,
          actor,
          tx,
        );
        const starting = plan.creates.flatMap((c, i) =>
          c.stockDepart
            ? [
                {
                  material: createdRows[i],
                  type: 'adjustment' as const,
                  quantity: c.stockDepart,
                  note: STOCK_INITIAL_NOTE,
                },
              ]
            : [],
        );
        await this.stock.recordImportedMovements(starting, batch.id, actor, tx);
        await this.batches.update(
          batch.id,
          {
            status: 'done',
            finishedAt: new Date(),
            createdCount: createdRows.length,
            updatedCount: plan.updates.length,
            errors: Prisma.DbNull,
          },
          tx,
        );
        return createdRows;
      }, IMPORT_TRANSACTION);

      return {
        status: 'done',
        createdCount: created.length,
        updatedCount: plan.updates.length,
        touchedMaterialIds: created
          .filter((_, i) => plan.creates[i].stockDepart)
          .map((m) => m.id),
      };
    } catch (err: unknown) {
      if (!isUniqueViolation(err)) throw err;
      // Another import or the form created the same description meanwhile:
      // the DB index refused it and the transaction rolled back.
      this.logger.warn(`Import batch ${batch.id}: description taken meanwhile`);
      return { status: 'failed', errors: [importErrors.sameTimeConflict()] };
    }
  }

  private check(
    rows: MaterialImportRowDto[],
    byId: Material[],
    taken: TakenName[],
  ) {
    const errors: ImportError[] = [];
    const creates: Array<{ data: MaterialImportCreate; stockDepart?: string }> =
      [];
    const updates: MaterialImportUpdate[] = [];
    const materialById = new Map(byId.map((m) => [m.id, m]));
    const takenByName = new Map(
      taken.map((t) => [normalizeDescription(t.description), t]),
    );
    const firstRowOfName = new Map<string, number>();
    const firstRowOfId = new Map<number, number>();

    for (const row of rows) {
      const rowErrors: ImportError[] = [];
      const name = normalizeDescription(row.description);

      const sameName = firstRowOfName.get(name);
      if (sameName !== undefined) {
        rowErrors.push(
          importErrors.descriptionTwice(
            row.row,
            row.description.trim(),
            sameName,
          ),
        );
      } else {
        firstRowOfName.set(name, row.row);
      }
      if (Number(row.purchase_price) < 0) {
        rowErrors.push(
          importErrors.negative(row.row, 'purchase_price', "le prix d'achat"),
        );
      }
      if (Number(row.minimum_stock) < 0) {
        rowErrors.push(
          importErrors.negative(row.row, 'minimum_stock', 'le stock minimum'),
        );
      }

      if (row.id == null) {
        this.checkNew(row, name, takenByName, rowErrors);
        if (rowErrors.length === 0) {
          creates.push({
            data: {
              description: row.description,
              unit: row.unit,
              purchasePrice: row.purchase_price,
              minimumStock: row.minimum_stock,
            },
            stockDepart: row.stock_depart ?? undefined,
          });
        }
      } else {
        const sameId = firstRowOfId.get(row.id);
        if (sameId !== undefined) {
          rowErrors.push(importErrors.idTwice(row.row, row.id, sameId));
        } else {
          firstRowOfId.set(row.id, row.row);
        }
        const material = materialById.get(row.id);
        this.checkExisting(row, row.id, name, material, rowErrors);
        if (rowErrors.length === 0 && material && this.changed(material, row)) {
          updates.push({
            id: row.id,
            purchasePrice: row.purchase_price,
            minimumStock: row.minimum_stock,
          });
        }
      }
      errors.push(...rowErrors);
    }
    return { errors, creates, updates };
  }

  private checkNew(
    row: MaterialImportRowDto,
    name: string,
    takenByName: Map<string, TakenName>,
    rowErrors: ImportError[],
  ): void {
    const existing = takenByName.get(name);
    if (existing) {
      rowErrors.push(
        existing.isActive
          ? importErrors.descriptionTaken(row.row, existing.description)
          : importErrors.descriptionTakenArchived(
              row.row,
              existing.description,
            ),
      );
    }
    if (row.stock_depart != null && Number(row.stock_depart) <= 0) {
      rowErrors.push(importErrors.stockDepartNotPositive(row.row));
    }
  }

  private checkExisting(
    row: MaterialImportRowDto,
    id: number,
    name: string,
    material: Material | undefined,
    rowErrors: ImportError[],
  ): void {
    if (!material) {
      rowErrors.push(importErrors.idNotFound(row.row, id));
    } else if (!material.isActive) {
      rowErrors.push(
        importErrors.idArchived(row.row, id, material.description),
      );
    } else {
      if (normalizeDescription(material.description) !== name) {
        rowErrors.push(
          importErrors.descriptionMismatch(row.row, id, material.description),
        );
      }
      if (
        material.unit.trim().toLowerCase() !== row.unit.trim().toLowerCase()
      ) {
        rowErrors.push(
          importErrors.unitChanged(row.row, material.unit, row.unit.trim()),
        );
      }
    }
    if (row.stock_depart != null) {
      rowErrors.push(importErrors.stockDepartOnExisting(row.row));
    }
  }

  /** An unchanged row is skipped — re-importing the export changes nothing. */
  private changed(material: Material, row: MaterialImportRowDto): boolean {
    return (
      !material.purchasePrice.equals(row.purchase_price) ||
      !material.minimumStock.equals(row.minimum_stock)
    );
  }
}
