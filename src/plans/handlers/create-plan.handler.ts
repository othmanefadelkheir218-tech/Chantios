import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StripeService } from '../../stripe/stripe.service';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { toFeatureRows } from '../helpers/plan.helper';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class CreatePlanHandler {
  constructor(
    @InjectPinoLogger(CreatePlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
    private readonly stripe: StripeService,
  ) {}

  /**
   * Plan + features in one transaction. A new plan is never default unless
   * asked. The Stripe Price is created first — a Stripe failure fails the
   * whole creation, a plan with no real Price can never be billed.
   */
  async execute(dto: CreatePlanDto) {
    this.logger.info(`Creating plan ${dto.name}`);

    const stripePriceId = await this.stripe.createPlanPrice(
      dto.name,
      dto.base_price,
    );
    const features = toFeatureRows(dto.features);

    const plan = await this.plans.create(
      {
        name: dto.name,
        basePrice: dto.base_price,
        stripePriceId,
        isDefault: dto.is_default ?? false,
      },
      features,
    );
    this.logger.info(
      `Plan created: ${plan.id} (${features.length} features, default: ${plan.isDefault}, stripe price ${stripePriceId})`,
    );
    return plan;
  }
}
