import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toMaterialWithStockEntity } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/**
 * `GET /api/materials/low-stock` — `on_hand <= minimum_stock`. A read only:
 * the `low_stock` alert itself is raised where stock moves
 * (`stock/handlers/check-coverage.handler.ts`), so a GET never sends mail.
 */
@Injectable()
export class FindLowStockHandler {
  constructor(
    @InjectPinoLogger(FindLowStockHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialRepository,
  ) {}

  async execute() {
    const rows = await this.materials.findLowStock();
    this.logger.debug(`${rows.length} material(s) at or below minimum_stock`);
    return rows.map((m) => toMaterialWithStockEntity(m, m.stock));
  }
}
