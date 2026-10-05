import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlanFeatureDto } from '../dto/create-plan.dto';
import { CreatePlanVersionDto } from '../dto/create-plan-version.dto';
import { toFeatureRows } from '../helpers/plan.helper';
import { PlanRepository } from '../repositories/plan.repository';

@Injectable()
export class CreatePlanVersionHandler {
  constructor(
    @InjectPinoLogger(CreatePlanVersionHandler.name)
    private readonly logger: PinoLogger,
    private readonly plans: PlanRepository,
  ) {}

  /**
   * A plan in use is never edited. The old row is deactivated, a new row is
   * created with `parent_plan_id`. Tenants keep the old `plan_id`.
   */
  async execute(parentId: number, dto: CreatePlanVersionDto) {
    this.logger.info(`Creating a new version of plan ${parentId}`);

    const parent = await this.plans.findById(parentId);
    if (!parent) {
      this.logger.warn(`Cannot create version: plan ${parentId} not found`);
      throw new NotFoundException('Plan not found');
    }
    if (!parent.isActive) {
      throw new BadRequestException(
        'This plan is already replaced. Create the new version from the active one.',
      );
    }

    // What the request leaves out is copied from the parent.
    const features = toFeatureRows(
      dto.features ??
        parent.features.map((f): PlanFeatureDto => ({
          feature_key: f.featureKey as PlanFeatureDto['feature_key'],
          limit_value: f.limitValue,
          overage_rate: f.overageRate.toString(),
        })),
    );

    const version = await this.plans.createVersion(
      parentId,
      {
        name: dto.name ?? parent.name,
        basePrice: dto.base_price ?? parent.basePrice.toString(),
        stripePriceId: dto.stripe_price_id ?? null,
      },
      features,
      parent.isDefault,
    );
    this.logger.info(
      `Plan version created: ${version.id} (parent ${parentId})`,
    );
    return version;
  }
}
