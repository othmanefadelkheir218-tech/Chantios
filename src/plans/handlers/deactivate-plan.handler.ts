import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class DeactivatePlanHandler {
  constructor(
    @InjectPinoLogger(DeactivatePlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  /**
   * Refuses the default plan: with no default, the next signup
   * (step 02 registration) would fail with a confusing error.
   */
  async execute(id: number) {
    this.logger.info(`Deactivating plan ${id}`);

    const plan = await this.plans.findById(id);
    if (!plan) {
      this.logger.warn(`Cannot deactivate: plan ${id} not found`);
      throw new NotFoundException('Plan not found');
    }
    if (plan.isDefault) {
      this.logger.warn(`Cannot deactivate: plan ${id} is the default plan`);
      throw new BadRequestException(
        'This is the default plan. Make another plan the default first, then deactivate this one.',
      );
    }
    if (!plan.isActive) return plan;

    const updated = await this.plans.deactivate(id);
    this.logger.info(`Plan deactivated: ${id}`);
    return updated;
  }
}
