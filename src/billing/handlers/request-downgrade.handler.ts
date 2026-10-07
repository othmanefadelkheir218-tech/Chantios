import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlanWithFeatures } from '../../plans/repositories/plan.repository';
import { PlansService } from '../../plans/plans.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { ChangePlanDto } from '../dto/change-plan.dto';
import { UsageCounterHelper } from '../helpers/usage-counter.helper';

function storageLimitOf(plan: PlanWithFeatures): number {
  return (
    plan.features.find((f) => f.featureKey === 'storage_gb')?.limitValue ?? 0
  );
}

/**
 * `POST /api/billing/change-plan` — the ONE place usage is checked before an
 * action (doc/notes/subscription-plans.md). Every other dimension is billed,
 * never blocked, because deactivating a resource drops its usage instantly;
 * storage does not — the files still exist until deleted. So a downgrade
 * that would shrink the storage allowance below what is already on disk is
 * refused up front. Anything else (same or bigger `storage_gb`, or a change
 * that does not touch `storage_gb` at all) goes straight to the existing
 * pending-plan mechanism — no gate needed.
 */
@Injectable()
export class RequestDowngradeHandler {
  constructor(
    @InjectPinoLogger(RequestDowngradeHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly usageCounter: UsageCounterHelper,
  ) {}

  async execute(tenantId: number, dto: ChangePlanDto) {
    this.logger.info(
      `Tenant ${tenantId} requests a plan change to ${dto.plan_id}`,
    );

    const subscription = await this.subscriptions.findByTenant(tenantId);
    const currentPlan = await this.plans.findOne(subscription.planId);
    const targetPlan = await this.plans.findOne(dto.plan_id); // 404 when missing

    const currentLimit = storageLimitOf(currentPlan);
    const targetLimit = storageLimitOf(targetPlan);

    if (targetLimit < currentLimit) {
      const usage = await this.usageCounter.countAll(tenantId);
      if (usage.storage_gb > targetLimit) {
        this.logger.warn(
          `Tenant ${tenantId} downgrade to plan ${dto.plan_id} refused: ` +
            `${usage.storage_gb.toFixed(2)} GB used, target allows ${targetLimit} GB`,
        );
        throw new BadRequestException(
          `Storage usage (${usage.storage_gb.toFixed(2)} GB) is still above the ` +
            `new plan's ${targetLimit} GB limit. Delete files down to the target, then try again.`,
        );
      }
    }

    // Everything else (not a storage shrink, or already within target): the
    // existing pending-plan mechanism handles activity/sameness checks and
    // schedules the change for the next renewal — not built twice here.
    return this.subscriptions.changePlan(tenantId, dto);
  }
}
