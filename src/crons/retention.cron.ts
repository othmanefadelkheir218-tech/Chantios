import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlansService } from '../plans/plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantRunner } from './tenant-runner.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily, per company: `retention_days` of the company's plan deletes
 *   - `analytics_events` older than that, and
 *   - READ `notifications` older than that.
 * It never deletes an unread notification, a project, a quote, an invoice, an
 * hour or a photo. A plan with `retention_days = 0` keeps everything.
 */
@Injectable()
export class RetentionCron {
  constructor(
    @InjectPinoLogger(RetentionCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly notifications: NotificationsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Cron('30 3 * * *')
  async run(
    now: Date = new Date(),
  ): Promise<{ notifications: number; events: number }> {
    const deleted = { notifications: 0, events: 0 };
    try {
      await this.runner.forEachTenant('retention', async (tenant) => {
        const subscription = await this.subscriptions.findByTenant(tenant.id);
        const plan = await this.plans.findOne(subscription.planId);
        const days = plan.features.find(
          (feature) => feature.featureKey === 'retention_days',
        )?.limitValue;
        if (!days || days <= 0) return;

        const before = new Date(now.getTime() - days * DAY_MS);
        deleted.notifications += await this.notifications.purgeReadBefore(
          tenant.id,
          before,
        );
        deleted.events += await this.analytics.purgeBefore(tenant.id, before);
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Retention cron failed');
    }
    this.logger.info(
      `Retention cron: ${deleted.notifications} read notification(s), ${deleted.events} event(s) deleted`,
    );
    return deleted;
  }
}
