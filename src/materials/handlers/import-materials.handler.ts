import { Injectable } from '@nestjs/common';
import { Material } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { ActingParty } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { assertNonNegative } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

export interface MaterialImportCreate {
  description: string;
  unit: string;
  purchasePrice: string;
  minimumStock: string;
}

export interface MaterialImportUpdate {
  id: number;
  purchasePrice: string;
  minimumStock: string;
}

/**
 * The materials side of a bulk import (doc/notes/bulk-import.md). The
 * `imports` module checks the rows; this reads what it needs to check them
 * and writes the result inside the caller's transaction. An import only ever
 * creates a material or changes its `purchase_price` / `minimum_stock` —
 * never its description or unit.
 */
@Injectable()
export class ImportMaterialsHandler {
  constructor(
    @InjectPinoLogger(ImportMaterialsHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  /** The materials named by `id` and the ones whose description is already taken — 2 queries. */
  async load(ids: number[], normalizedDescriptions: string[]) {
    const [byId, taken] = await Promise.all([
      this.materials.findManyByIds([...new Set(ids)]),
      this.materials.findByNormalizedDescriptions([
        ...new Set(normalizedDescriptions),
      ]),
    ]);
    return { byId, taken };
  }

  /** Creates then updates, in `tx`. Returns the created rows, in input order. */
  async write(
    creates: MaterialImportCreate[],
    updates: MaterialImportUpdate[],
    actor: ActingParty,
    tx: TenantTransactionClient,
  ): Promise<Material[]> {
    const created: Material[] = [];
    for (const row of creates) {
      assertNonNegative(row.purchasePrice, 'purchase_price');
      assertNonNegative(row.minimumStock, 'minimum_stock');
      created.push(
        await this.materials.create(
          {
            tenantId: actor.tenantId,
            description: row.description.trim(),
            unit: row.unit.trim(),
            purchasePrice: row.purchasePrice,
            minimumStock: row.minimumStock,
          },
          tx,
        ),
      );
    }
    for (const row of updates) {
      assertNonNegative(row.purchasePrice, 'purchase_price');
      assertNonNegative(row.minimumStock, 'minimum_stock');
      await this.materials.update(
        row.id,
        { purchasePrice: row.purchasePrice, minimumStock: row.minimumStock },
        tx,
      );
    }
    this.logger.info(
      `Import wrote ${created.length} new and ${updates.length} updated materials`,
    );
    return created;
  }
}
