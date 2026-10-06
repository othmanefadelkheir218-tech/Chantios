import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ServicesService } from '../../services/services.service';
import { RecipeLine, walkRecipe } from '../helpers/recipe.helper';

/**
 * The READ side of the recipe walk — calculates, saves nothing. Step 09's
 * `material-prefill` calls this through `StockService` so the report screen
 * and the quote-acceptance reservation (`create-reservations.handler`) use
 * the same `walkRecipe` — one implementation, two callers.
 */
@Injectable()
export class WalkRecipeHandler {
  constructor(
    @InjectPinoLogger(WalkRecipeHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServicesService,
  ) {}

  async execute(lines: RecipeLine[]) {
    for (const line of lines) {
      if (line.serviceId == null) continue;
      // Throws NotFoundException if the service does not belong to this tenant.
      await this.services.findOne(line.serviceId);
    }

    const map = await walkRecipe(lines, (serviceId) =>
      this.services.getRecipeRaw(serviceId),
    );
    const items = [...map.entries()].map(([materialId, quantity]) => ({
      materialId,
      quantity: quantity.toString(),
    }));
    this.logger.debug(
      `Recipe walk over ${lines.length} line(s) gave ${items.length} material(s)`,
    );
    return items;
  }
}
