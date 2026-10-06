import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toMaterialWithStockEntity } from '../helpers/material.helper';
import { MaterialRepository } from '../repositories/material.repository';

/**
 * `GET /api/materials/low-stock` — `on_hand <= minimum_stock`. Alerting
 * (pushing this to the manager) is step 13's job — `// TODO` left there,
 * not here; this handler only reads the real, current list.
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
    // TODO: step 13 — fire the low-stock alert for each of these, once the
    // alerts module exists. Soft read only here.
    return rows.map((m) => toMaterialWithStockEntity(m, m.stock));
  }
}
