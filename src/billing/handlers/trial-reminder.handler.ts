import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../notifications/notifications.service';
import { isTrialEndingSoon } from '../../subscriptions/helpers/subscription.helper';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

/**
 * Day 11: "your trial ends in 3 days, add a payment method"
 * (doc/notes/subscription-plans.md § The end of the trial). Sent once:
 * `dedupeDays` covers the whole trial, so the daily cron never repeats it.
 */
@Injectable()
export class TrialReminderHandler {
  constructor(
    @InjectPinoLogger(TrialReminderHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(tenantId: number, now: Date): Promise<boolean> {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!isTrialEndingSoon(subscription.status, subscription.periodEnd, now)) {
      return false;
    }
    await this.notifications.dispatch('trial_ending', {
      tenantId,
      dedupeDays: 14,
      payload: {
        entity_id: tenantId,
        trial_end: subscription.periodEnd.toISOString().slice(0, 10),
      },
    });
    this.logger.info(`Trial-ending reminder for tenant ${tenantId}`);
    return true;
  }
}
