import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ServicesService } from '../../services/services.service';
import { RecipeLine, walkRecipe } from '../helpers/recipe.helper';
import { toReservationEntity } from '../helpers/stock.helper';
import { StockReservationRepository } from '../repositories/stock-reservation.repository';

/**
 * Walks the recipe for every line that carries a `service_id` and
 * `upsertAdd`s the result per material. **No HTTP route** — step 06 (quote
 * acceptance, not built yet) calls this through `StockService` once a quote
 * is accepted. See `recipe.helper.ts` for the documented judgment call on
 * the `RecipeLine` input shape.
 */
@Injectable()
export class CreateReservationsHandler {
  constructor(
    @InjectPinoLogger(CreateReservationsHandler.name)
    private readonly logger: PinoLogger,
    private readonly services: ServicesService,
    private readonly reservations: StockReservationRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    projectId: number,
    lines: RecipeLine[],
    actor: AuthenticatedUser,
  ) {
    this.logger.info(
      `Creating reservations for project ${projectId} from ${lines.length} line(s)`,
    );

    const reserveMap = await walkRecipe(lines, (serviceId) =>
      this.services.getRecipeRaw(serviceId),
    );

    const results = [];
    for (const [materialId, qty] of reserveMap) {
      if (qty.lte(0)) continue;
      const row = await this.reservations.upsertAdd(
        projectId,
        materialId,
        qty.toString(),
        actor.tenantId,
      );
      results.push(toReservationEntity(row));
    }

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create_reservations',
      entityType: 'project',
      entityId: projectId,
      newValue: { materials: results.map((r) => r.materialId) },
      ipAddress: null,
    });
    this.logger.info(
      `${results.length} reservation(s) upserted for project ${projectId}`,
    );
    return results;
  }
}
