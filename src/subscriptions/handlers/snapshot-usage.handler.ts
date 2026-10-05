import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlansService } from '../../plans/plans.service';
import { SnapshotUsageInput } from '../dto/snapshot-usage.dto';
import { computeOverageAmount } from '../helpers/subscription.helper';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class SnapshotUsageHandler {
  constructor(
    @InjectPinoLogger(SnapshotUsageHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlansService,
  ) {}

  /**
   * Copies `limit_value` and `overage_rate` into the snapshot, so a past
   * invoice never shifts when the plan changes later. `retention_days` is a
   * value, not a count, so it gets no row.
   */
  async execute(input: SnapshotUsageInput): Promise<number> {
    const { tenantId, periodStart, periodEnd, usage } = input;
    this.logger.info(`Snapshotting usage of tenant ${tenantId}`);

    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription) {
      this.logger.warn(
        `Cannot snapshot usage: no subscription for ${tenantId}`,
      );
      throw new NotFoundException('Subscription not found for this tenant');
    }

    const plan = await this.plans.findOne(subscription.planId);
    const rows = plan.features
      .filter((f) => f.featureKey !== 'retention_days')
      .filter((f) => usage[f.featureKey] !== undefined)
      .map((f) => ({
        tenantId,
        periodStart,
        periodEnd,
        featureKey: f.featureKey,
        actualCount: usage[f.featureKey],
        includedAllowance: f.limitValue,
        overageRate: f.overageRate,
        overageAmount: computeOverageAmount(
          usage[f.featureKey],
          f.limitValue,
          f.overageRate,
        ),
      }));

    const written = await this.subscriptions.snapshotUsage(rows);
    this.logger.info(`Usage snapshot of tenant ${tenantId}: ${written} rows`);
    return written;
  }
}
