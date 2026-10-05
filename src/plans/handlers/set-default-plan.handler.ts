import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class SetDefaultPlanHandler {
  constructor(
    @InjectPinoLogger(SetDefaultPlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  /** Clears the old default first, in the same transaction. */
  async execute(id: string) {
    this.logger.info(`Setting plan ${id} as default`);

    const plan = await this.plans.findById(id);
    if (!plan) {
      this.logger.warn(`Cannot set default: plan ${id} not found`);
      throw new NotFoundException('Plan not found');
    }
    if (!plan.isActive) {
      this.logger.warn(`Cannot set default: plan ${id} is inactive`);
      throw new BadRequestException(
        'An inactive plan cannot be the default: new signups could not pick it',
      );
    }
    if (plan.isDefault) return plan;

    const updated = await this.plans.setDefault(id);
    this.logger.info(`Plan ${id} is now the default`);
    return updated;
  }
}
