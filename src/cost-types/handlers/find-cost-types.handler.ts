import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toCostTypeEntity } from '../helpers/cost-type.helper';
import { CostTypeRepository } from '../repositories/cost-type.repository';

/** `GET /api/cost-types` — shared defaults + this tenant's own. */
@Injectable()
export class FindCostTypesHandler {
  constructor(
    @InjectPinoLogger(FindCostTypesHandler.name)
    private readonly logger: PinoLogger,
    private readonly costTypes: CostTypeRepository,
  ) {}

  async execute(tenantId: number) {
    this.logger.debug(`Listing cost types for tenant ${tenantId}`);
    const rows = await this.costTypes.findAllForTenant(tenantId);
    return rows.map(toCostTypeEntity);
  }

  /** Internal: a visible cost type or `null` (used by `purchase-invoices`). */
  findVisibleById(id: number, tenantId: number) {
    return this.costTypes.findVisibleById(id, tenantId);
  }
}
