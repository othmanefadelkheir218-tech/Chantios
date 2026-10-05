import { Injectable } from '@nestjs/common';
import { CreatePlanVersionDto } from './dto/create-plan-version.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { FindPlansQueryDto } from './dto/find-plans-query.dto';
import { CreatePlanVersionHandler } from './handlers/create-plan-version.handler';
import { CreatePlanHandler } from './handlers/create-plan.handler';
import { DeactivatePlanHandler } from './handlers/deactivate-plan.handler';
import { FindPlanHandler } from './handlers/find-plan.handler';
import { FindPlansHandler } from './handlers/find-plans.handler';
import { SetDefaultPlanHandler } from './handlers/set-default-plan.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class PlansService {
  constructor(
    private readonly createPlan: CreatePlanHandler,
    private readonly findPlans: FindPlansHandler,
    private readonly findPlan: FindPlanHandler,
    private readonly deactivatePlan: DeactivatePlanHandler,
    private readonly setDefaultPlan: SetDefaultPlanHandler,
    private readonly createPlanVersion: CreatePlanVersionHandler,
  ) {}

  create(dto: CreatePlanDto) {
    return this.createPlan.execute(dto);
  }

  findAll(query: FindPlansQueryDto) {
    return this.findPlans.execute(query);
  }

  findOne(id: string) {
    return this.findPlan.execute(id);
  }

  /** The plan a new signup lands on, or null when none is set. */
  findDefault() {
    return this.findPlan.executeDefault();
  }

  deactivate(id: string) {
    return this.deactivatePlan.execute(id);
  }

  setDefault(id: string) {
    return this.setDefaultPlan.execute(id);
  }

  createVersion(id: string, dto: CreatePlanVersionDto) {
    return this.createPlanVersion.execute(id, dto);
  }
}
