import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { computeOverageAmount } from '../../subscriptions/helpers/subscription.helper';
import { PlansService } from '../../plans/plans.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { BILLED_FEATURE_KEYS } from '../helpers/usage-counter.helper';
import { CountUsageHandler } from './count-usage.handler';

/** `GET /api/billing/usage` — current usage vs the tenant's current plan allowance. */
@Injectable()
export class FindUsageHandler {
  constructor(
    @InjectPinoLogger(FindUsageHandler.name)
    private readonly logger: PinoLogger,
    private readonly countUsage: CountUsageHandler,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
  ) {}

  async execute(tenantId: number) {
    this.logger.debug(
      `Building usage-vs-allowance view for tenant ${tenantId}`,
    );
    const subscription = await this.subscriptions.findByTenant(tenantId);
    const plan = await this.plans.findOne(subscription.planId);
    const usage = await this.countUsage.execute(tenantId);

    return BILLED_FEATURE_KEYS.map((featureKey) => {
      const feature = plan.features.find((f) => f.featureKey === featureKey);
      const actual = usage[featureKey] ?? 0;
      const limit = feature?.limitValue ?? 0;
      const overageRate = feature?.overageRate ?? 0;
      return {
        feature_key: featureKey,
        actual,
        limit,
        overage_rate: overageRate.toString(),
        overage_amount: computeOverageAmount(
          actual,
          limit,
          overageRate,
        ).toString(),
      };
    });
  }
}
