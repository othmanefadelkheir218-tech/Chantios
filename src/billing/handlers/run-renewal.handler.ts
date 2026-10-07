import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { addOneMonth } from '../../common/helpers/billing-period.helper';
import { PlansService } from '../../plans/plans.service';
import { computeOverageAmount } from '../../subscriptions/helpers/subscription.helper';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { StripeService } from '../../stripe/stripe.service';
import { ApplyPendingPlanIfDueHandler } from './apply-pending-plan-if-due.handler';
import { CountUsageHandler } from './count-usage.handler';

/**
 * The renewal job, for one tenant, run inside that tenant's CLS context
 * (the caller — the processor or the manual admin route — is responsible for
 * opening it, the same way `TenantRunner` does for crons).
 *
 * In order:
 *   1. count actual usage (through `CountUsageHandler`/`UsageCounterHelper`);
 *   2. write one `billing_usage_snapshots` row per billed dimension, copying
 *      `limit_value`/`overage_rate` at THIS moment (`SubscriptionsService.snapshotUsage`,
 *      which already does the copy + `computeOverageAmount` — not redone here,
 *      only summed again from the same inputs for the Stripe push below);
 *   3. push the total overage to Stripe, best-effort;
 *   4. roll `period_start`/`period_end` forward one month;
 *   5. apply a pending plan if its effective date has now passed.
 */
@Injectable()
export class RunRenewalHandler {
  constructor(
    @InjectPinoLogger(RunRenewalHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly countUsage: CountUsageHandler,
    private readonly applyPendingPlan: ApplyPendingPlanIfDueHandler,
    private readonly stripe: StripeService,
  ) {}

  async execute(tenantId: number) {
    this.logger.info(`Running renewal for tenant ${tenantId}`);

    const subscription = await this.subscriptions.findByTenant(tenantId);
    const plan = await this.plans.findOne(subscription.planId);
    const usage = await this.countUsage.execute(tenantId);

    let totalOverage = new Prisma.Decimal(0);
    for (const feature of plan.features) {
      if (feature.featureKey === 'retention_days') continue;
      const actual = usage[feature.featureKey];
      if (actual === undefined) continue;
      totalOverage = totalOverage.plus(
        computeOverageAmount(actual, feature.limitValue, feature.overageRate),
      );
    }

    await this.subscriptions.snapshotUsage({
      tenantId,
      periodStart: subscription.periodStart,
      periodEnd: subscription.periodEnd,
      usage,
    });

    if (totalOverage.gt(0)) {
      const closedPeriod = `${subscription.periodStart.toISOString().slice(0, 10)} – ${subscription.periodEnd.toISOString().slice(0, 10)}`;
      // Stable across a BullMQ retry of this SAME renewal (same tenant, same
      // closed period) so Stripe de-duplicates instead of double-billing.
      const idempotencyKey = `overage:${tenantId}:${subscription.periodStart.toISOString()}`;
      await this.stripe.pushOverageInvoiceItem(
        subscription.stripeCustomerId,
        totalOverage,
        `Overage for ${closedPeriod}`,
        idempotencyKey,
      );
    }

    const newPeriodStart = subscription.periodEnd;
    const newPeriodEnd = addOneMonth(newPeriodStart);
    await this.subscriptions.setPeriod(tenantId, newPeriodStart, newPeriodEnd);
    await this.applyPendingPlan.execute(tenantId, subscription, newPeriodStart);

    this.logger.info(
      `Renewal done for tenant ${tenantId}: overage ${totalOverage.toString()} EUR, ` +
        `period rolled to ${newPeriodEnd.toISOString()}`,
    );

    return { usage, totalOverage: totalOverage.toString() };
  }
}
