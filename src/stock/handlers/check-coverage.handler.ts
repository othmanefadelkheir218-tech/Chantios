import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MaterialsService } from '../../materials/materials.service';

/**
 * Runs after every purchase/positive adjustment: reads the live stock level
 * and decides whether this material's active reservations are now covered
 * (`available >= 0`). The decision itself is real and testable; the actual
 * alert side-effect (firing/clearing a `project_margin_alerts`-style row)
 * does not exist yet — `// TODO: step 13`. Soft only, never a hard block
 * (doc/notes/qa-project-quote-stock-invoices.md § "Alert style").
 */
@Injectable()
export class CheckCoverageHandler {
  constructor(
    @InjectPinoLogger(CheckCoverageHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialsService,
  ) {}

  async execute(materialId: number) {
    const level = await this.materials.getStockLevel(materialId);
    const covered = level.available.gte(0);
    this.logger.info(
      `Coverage check for material ${materialId}: available=${level.available.toString()}, covered=${covered}`,
    );

    // TODO: step 13 — clear the low-stock / coverage alert for this material
    // here once the alerts module exists. Firing the alert in the first
    // place also belongs there, at the point `available` goes negative.

    return {
      materialId,
      onHand: level.onHand,
      reserved: level.reserved,
      available: level.available,
      covered,
    };
  }
}
