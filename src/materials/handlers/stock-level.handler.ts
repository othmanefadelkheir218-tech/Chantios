import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';
import { toMaterialWithStockEntity } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/**
 * Reads `material_stock_live` for one material. `GET /api/materials/:id`
 * calls this; `check-coverage.handler` (stock module) calls it too, through
 * `MaterialsService`, never this repository directly. Low-stock alerting is
 * step 13 — `// TODO` left at that point, not here (this handler only
 * reads, it never decides to fire anything).
 */
@Injectable()
export class StockLevelHandler {
  constructor(
    @InjectPinoLogger(StockLevelHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  async execute(materialId: number) {
    const material = await this.materials.findById(materialId);
    if (!material) {
      this.logger.warn(
        `Cannot read stock level: material ${materialId} not found`,
      );
      throw new NotFoundException('Material not found');
    }
    const level = await this.materials.findStockLevel(materialId);
    return toMaterialWithStockEntity(material, level ?? undefined);
  }

  /** Internal API for `stock` module's `check-coverage.handler`. */
  async rawLevel(materialId: number) {
    const level = await this.materials.findStockLevel(materialId);
    return (
      level ?? {
        materialId,
        onHand: new Prisma.Decimal(0),
        reserved: new Prisma.Decimal(0),
        available: new Prisma.Decimal(0),
      }
    );
  }
}
