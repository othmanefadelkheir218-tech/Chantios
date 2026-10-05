import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class FindPlanHandler {
  constructor(
    @InjectPinoLogger(FindPlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  async execute(id: number) {
    this.logger.debug(`Finding plan ${id}`);

    const plan = await this.plans.findById(id);
    if (!plan) {
      this.logger.warn(`Plan not found: ${id}`);
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  /** The plan a new signup lands on — used by step 02 registration. */
  async executeDefault() {
    return this.plans.findDefault();
  }
}
