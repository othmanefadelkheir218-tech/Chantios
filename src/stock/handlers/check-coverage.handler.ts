import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MaterialsService } from '../../materials/materials.service';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * Runs after every purchase, adjustment and declared consumption: reads the
 * live stock level and raises the two stock alerts through
 * `NotificationsService.dispatch` (soft only, never a hard block —
 * doc/notes/qa-project-quote-stock-invoices.md § "Alert style"):
 *
 *   - `low_stock`         — `on_hand <= minimum_stock`
 *   - `reservation_unmet` — `available < 0`, the reservations are not covered
 *
 * Each repeats at most once a day per material, so a material that stays low
 * does not alert on every movement. Once the stock is back above the minimum
 * nothing fires — the alert clears by itself, there is no state to reset.
 */
@Injectable()
export class CheckCoverageHandler {
  constructor(
    @InjectPinoLogger(CheckCoverageHandler.name)
    private readonly logger: PinoLogger,
    private readonly materials: MaterialsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(materialId: number, tenantId: number) {
    const level = await this.materials.getStockLevel(materialId);
    const covered = level.available.gte(0);
    this.logger.info(
      `Coverage check for material ${materialId}: available=${level.available.toString()}, covered=${covered}`,
    );

    const material = await this.materials.findByIdRaw(materialId);
    if (material?.isActive) {
      const payload = {
        entity_id: materialId,
        material_id: materialId,
        material_name: material.description,
        unit: material.unit,
      };
      if (level.onHand.lte(material.minimumStock)) {
        await this.notifications.dispatch('low_stock', {
          tenantId,
          dedupeDays: 1,
          payload: { ...payload, on_hand: level.onHand.toString() },
        });
      }
      if (!covered) {
        await this.notifications.dispatch('reservation_unmet', {
          tenantId,
          dedupeDays: 1,
          payload: { ...payload, short_by: level.available.abs().toString() },
        });
      }
    }

    return {
      materialId,
      onHand: level.onHand,
      reserved: level.reserved,
      available: level.available,
      covered,
    };
  }
}
