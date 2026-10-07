import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsageCounterHelper } from '../billing/helpers/usage-counter.helper';
import { NotificationsService } from '../notifications/notifications.service';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantRunner } from './tenant-runner.service';

/**
 * `alerts.md`'s "unusual usage spike" names no number ("storage or AI tokens
 * exceed a threshold"), and AI tokens are v2 — open question 12 on both
 * `doc/notes/A_progress-tracker.md` and `doc/Schema Proposal.md`. Built as
 * storage only, one named constant, same pattern as `STALLED_PROJECT_DAYS`
 * and the margin 80%/95% thresholds — trivial to change once a real number
 * is decided.
 */
export const USAGE_SPIKE_STORAGE_THRESHOLD = 0.9;

/**
 * Every morning, per company: live storage usage vs the plan's `storage_gb`
 * allowance, through `UsageCounterHelper.countAll` — the SAME computation
 * `GET /api/billing/usage` and the renewal snapshot already use, so all three
 * never disagree. A platform alert (`usage_spike`, no `tenantId` field on the
 * dispatch — see `notification.types.ts`).
 *
 * `dedupeDays` is NOT passed here: `DispatchNotificationHandler.toPlatform()`
 * never calls `dropRecentlyNotified` (only the tenant-staff branch of
 * `execute()` does), so a platform alert has no deduplication today. A tenant
 * sitting above the threshold re-alerts every run until it drops back under
 * it. This is a known limitation, documented in the step 16 recap — not
 * patched here with a second, parallel dedup mechanism.
 */
@Injectable()
export class UsageSpikeCron {
  constructor(
    @InjectPinoLogger(UsageSpikeCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly usageCounter: UsageCounterHelper,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 7 * * *')
  async run(): Promise<{ alerts: number }> {
    let alerts = 0;
    try {
      await this.runner.forEachTenant('usage-spike', async (tenant) => {
        const subscription = await this.subscriptions.findByTenant(tenant.id);
        const plan = await this.plans.findOne(subscription.planId);
        const limitGb = plan.features.find(
          (feature) => feature.featureKey === 'storage_gb',
        )?.limitValue;
        if (!limitGb || limitGb <= 0) return;

        const usage = await this.usageCounter.countAll(tenant.id);
        const ratio = usage.storage_gb / limitGb;
        if (ratio < USAGE_SPIKE_STORAGE_THRESHOLD) return;

        await this.notifications.dispatch('usage_spike', {
          payload: {
            entity_id: tenant.id,
            tenant_id: tenant.id,
            company_name: tenant.name,
            metric: 'storage',
            storage_gb: usage.storage_gb,
            limit_gb: limitGb,
          },
        });
        alerts += 1;
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Usage-spike cron failed');
    }
    this.logger.info(`Usage-spike cron: ${alerts} alert(s)`);
    return { alerts };
  }
}
