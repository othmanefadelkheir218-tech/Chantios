import { Injectable } from '@nestjs/common';
import { Prisma, TenantSubscription } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { addOneMonth } from '../../common/helpers/billing-period.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { PlansService } from '../../plans/plans.service';
import {
  computeOverageAmount,
  isBilled,
} from '../../subscriptions/helpers/subscription.helper';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { StripeService } from '../../stripe/stripe.service';
import { StripeRenewalInput } from '../dto/renewal-job.dto';
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
 *   5. apply a pending plan if its effective date has now passed;
 *   6. a `trialing` subscription: its first renewal IS the end of the trial
 *      → `past_due` + `grace_ends_at`, alert `trial_ended` (step 20).
 * A `cancelled` (blocked) company is skipped: never billed, period frozen
 * (doc/notes/subscription-plans.md § The end of the trial).
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
    private readonly notifications: NotificationsService,
  ) {}

  async execute(tenantId: number) {
    this.logger.info(`Running renewal for tenant ${tenantId}`);
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!isBilled(subscription.status)) {
      this.logger.info(
        `Renewal skipped for tenant ${tenantId}: subscription is ${subscription.status}`,
      );
      return { skipped: true, usage: null, totalOverage: '0' };
    }
    // A company that pays by card renews when Stripe makes its invoice
    // (`executeForStripeInvoice`, step 21) — never from the nightly job.
    if (subscription.stripeSubscriptionId) {
      this.logger.info(
        `Renewal skipped for tenant ${tenantId}: billed by Stripe subscription ${subscription.stripeSubscriptionId}`,
      );
      return { skipped: true, usage: null, totalOverage: '0' };
    }

    const { usage, totalOverage } = await this.billUsage(
      subscription,
      subscription.periodStart,
      subscription.periodEnd,
      null,
    );

    const newPeriodStart = subscription.periodEnd;
    const newPeriodEnd = addOneMonth(newPeriodStart);
    await this.subscriptions.setPeriod(tenantId, newPeriodStart, newPeriodEnd);
    await this.applyPendingPlan.execute(tenantId, subscription, newPeriodStart);
    if (subscription.status === 'trialing') {
      await this.endTrial(tenantId, subscription.periodEnd);
    }

    this.logger.info(
      `Renewal done for tenant ${tenantId}: overage ${totalOverage.toString()} EUR, ` +
        `period rolled to ${newPeriodEnd.toISOString()}`,
    );

    return { skipped: false, usage, totalOverage: totalOverage.toString() };
  }

  /**
   * Step 21 (Q2): the renewal of a company that pays by card, run when Stripe
   * creates the monthly invoice (`invoice.created`). Same usage count, same
   * snapshot, same overage — the overage goes onto that invoice. Stripe owns
   * the dates (`customer.subscription.updated` copies them) and the status
   * (the payment events), so neither is touched here.
   */
  async executeForStripeInvoice(tenantId: number, input: StripeRenewalInput) {
    this.logger.info(
      `Running card renewal for tenant ${tenantId}, Stripe invoice ${input.invoiceId ?? '(already final)'}`,
    );
    const subscription = await this.subscriptions.findByTenant(tenantId);
    const { usage, totalOverage } = await this.billUsage(
      subscription,
      input.periodStart,
      input.periodEnd,
      input.invoiceId,
    );
    // The Stripe price already moved when the change was planned (Q4), so
    // this invoice IS the first one of the new plan: apply it now. Not by
    // date — `customer.subscription.updated` may already have moved
    // `pending_plan_effective_at` to the next period end.
    if (subscription.pendingPlanId) {
      this.logger.info(
        `Applying pending plan ${subscription.pendingPlanId} for tenant ${tenantId} (card renewal)`,
      );
      await this.subscriptions.applyPendingPlan(tenantId);
    }
    this.logger.info(
      `Card renewal done for tenant ${tenantId}: overage ${totalOverage.toString()} EUR`,
    );
    return { skipped: false, usage, totalOverage: totalOverage.toString() };
  }

  /**
   * Steps 1–3 of a renewal, shared by both paths: count usage, write the
   * snapshot (limits and rates copied now), push the total overage to Stripe.
   */
  private async billUsage(
    subscription: TenantSubscription,
    periodStart: Date,
    periodEnd: Date,
    invoiceId: string | null,
  ) {
    const { tenantId } = subscription;
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
      periodStart,
      periodEnd,
      usage,
    });

    if (totalOverage.gt(0)) {
      const closedPeriod = `${periodStart.toISOString().slice(0, 10)} – ${periodEnd.toISOString().slice(0, 10)}`;
      const idempotencyKey = `overage:${tenantId}:${periodStart.toISOString()}`;
      await this.stripe.pushOverageInvoiceItem(
        subscription.stripeCustomerId,
        totalOverage,
        `Overage for ${closedPeriod}`,
        idempotencyKey,
        invoiceId,
      );
    }
    return { usage, totalOverage };
  }

  /** Day 14: `past_due` for 7 days, then the block (`BlockExpiredGraceHandler`). */
  private async endTrial(tenantId: number, trialEnd: Date): Promise<void> {
    const graceEndsAt = await this.subscriptions.startGrace(tenantId, trialEnd);
    if (!graceEndsAt) return;
    await this.notifications.dispatch('trial_ended', {
      tenantId,
      payload: {
        entity_id: tenantId,
        grace_ends_at: graceEndsAt.toISOString().slice(0, 10),
      },
    });
  }
}
