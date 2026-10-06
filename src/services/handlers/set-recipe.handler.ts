import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MaterialsService } from '../../materials/materials.service';
import { SetRecipeDto } from '../dto/set-recipe.dto';
import {
  assertPositiveQuantity,
  toRecipeRowEntity,
} from '../helpers/service.helper';
import { ServiceRepository } from '../repositories/service.repository';

/**
 * `PUT /api/services/:id/recipe` — replaces the whole recipe in one
 * transaction (`service.repository.ts#replaceRecipe`). Every `material_id`
 * must belong to this tenant before anything is written.
 */
@Injectable()
export class SetRecipeHandler {
  constructor(
    @InjectPinoLogger(SetRecipeHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServiceRepository,
    private readonly materials: MaterialsService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    serviceId: number,
    dto: SetRecipeDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(
      `Replacing recipe for service ${serviceId} (${dto.items.length} item(s))`,
    );

    const service = await this.services.findById(serviceId);
    if (!service) {
      this.logger.warn(`Cannot set recipe: service ${serviceId} not found`);
      throw new NotFoundException('Service not found');
    }

    for (const item of dto.items) {
      assertPositiveQuantity(item.quantity_per_unit);
      const material = await this.materials.findByIdRaw(item.material_id);
      if (!material) {
        throw new NotFoundException(`Material ${item.material_id} not found`);
      }
    }

    await this.services.replaceRecipe(
      serviceId,
      actor.tenantId,
      dto.items.map((item) => ({
        materialId: item.material_id,
        quantityPerUnit: item.quantity_per_unit,
      })),
    );
    const rows = await this.services.findRecipe(serviceId);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'set_recipe',
      entityType: 'service',
      entityId: serviceId,
      newValue: { items: dto.items },
      ipAddress: null,
    });
    this.logger.info(
      `Recipe replaced for service ${serviceId}: ${rows.length} row(s)`,
    );
    return rows.map(toRecipeRowEntity);
  }
}
