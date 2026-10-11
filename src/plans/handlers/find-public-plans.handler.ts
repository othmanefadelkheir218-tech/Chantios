import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPublicPlan } from '../helpers/plan.helper';
import { PlanRepository } from '../repositories/plan.repository';

/** `GET /api/plans` — public pricing page: active plans only, cheapest first, no Stripe id. */
@Injectable()
export class FindPublicPlansHandler {
  constructor(
    @InjectPinoLogger(FindPublicPlansHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  async execute() {
    const plans = await this.plans.findActiveWithFeatures();
    this.logger.debug(`Public plan list: ${plans.length} active plan(s)`);
    return plans.map(toPublicPlan);
  }
}
