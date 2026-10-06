import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toRecipeRowEntity } from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

/** `GET /api/services/:id/recipe` — the `service_materials` rows. */
@Injectable()
export class GetRecipeHandler {
  constructor(
    @InjectPinoLogger(GetRecipeHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
  ) {}

  async execute(serviceId: number) {
    const service = await this.services.findById(serviceId);
    if (!service) {
      this.logger.warn(`Cannot read recipe: service ${serviceId} not found`);
      throw new NotFoundException('Service not found');
    }
    const rows = await this.services.findRecipe(serviceId);
    return rows.map(toRecipeRowEntity);
  }

  /**
   * Internal API for `stock` module's `create-reservations.handler` (via
   * `recipe.helper.ts#walkRecipe`) and, later, step 09's report pre-fill.
   * Raw `{ materialId, quantityPerUnit }` pairs, not the public entity.
   */
  async findRecipeRaw(serviceId: number) {
    const rows = await this.services.findRecipe(serviceId);
    return rows.map((row) => ({
      materialId: row.materialId,
      quantityPerUnit: row.quantityPerUnit,
    }));
  }
}
