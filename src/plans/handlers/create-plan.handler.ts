import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { toFeatureRows } from '../helpers/plan.helper';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class CreatePlanHandler {
  constructor(
    @InjectPinoLogger(CreatePlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  /** Plan + features in one transaction. A new plan is never default unless asked. */
  async execute(dto: CreatePlanDto) {
    this.logger.info(`Creating plan ${dto.name}`);

    const features = toFeatureRows(dto.features);

    const plan = await this.plans.create(
      {
        name: dto.name,
        basePrice: dto.base_price,
        stripePriceId: dto.stripe_price_id,
        isDefault: dto.is_default ?? false,
      },
      features,
    );
    this.logger.info(
      `Plan created: ${plan.id} (${features.length} features, default: ${plan.isDefault})`,
    );
    return plan;
  }
}
