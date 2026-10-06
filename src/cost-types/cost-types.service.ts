import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateCostTypeHandler } from './handlers/create-cost-type.handler';
import { FindCostTypesHandler } from './handlers/find-cost-types.handler';
import { UpdateCostTypeHandler } from './handlers/update-cost-type.handler';
import { CreateCostTypeDto } from './dto/create-cost-type.dto';
import { UpdateCostTypeDto } from './dto/update-cost-type.dto';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class CostTypesService {
  constructor(
    private readonly createCostType: CreateCostTypeHandler,
    private readonly findCostTypes: FindCostTypesHandler,
    private readonly updateCostType: UpdateCostTypeHandler,
  ) {}

  create(dto: CreateCostTypeDto, actor: AuthenticatedUser) {
    return this.createCostType.execute(dto, actor);
  }

  findAll(tenantId: number) {
    return this.findCostTypes.execute(tenantId);
  }

  update(id: number, dto: UpdateCostTypeDto, actor: AuthenticatedUser) {
    return this.updateCostType.execute(id, dto, actor);
  }

  // ---- Internal API for other modules (`purchase-invoices`) ----

  /** A shared default or this tenant's own row, or `null`. */
  findVisibleById(id: number, tenantId: number) {
    return this.findCostTypes.findVisibleById(id, tenantId);
  }
}
