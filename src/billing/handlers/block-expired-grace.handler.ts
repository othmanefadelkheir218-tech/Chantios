import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../notifications/notifications.service';
import { isGraceOver } from '../../subscriptions/helpers/subscription.helper';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

/**
 * The 7 days after a trial end or a failed payment ran out and nobody paid
 * → `cancelled`. The
 * company is blocked (`SubscriptionGuard`) but keeps every row, and can still
 * read its billing page to pay (doc/notes/subscription-plans.md § The end of
 * the trial). Setting `cancelled` clears `grace_ends_at` (`SetStatusHandler`).
 */
@Injectable()
export class BlockExpiredGraceHandler {
  constructor(
    @InjectPinoLogger(BlockExpiredGraceHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(tenantId: number, now: Date): Promise<boolean> {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!isGraceOver(subscription.status, subscription.graceEndsAt, now)) {
      return false;
    }
    await this.subscriptions.setStatus(tenantId, 'cancelled');
    await this.notifications.dispatch('subscription_blocked', {
      tenantId,
      payload: { entity_id: tenantId },
    });
    this.logger.warn(
      `Tenant ${tenantId} blocked: grace period ended without a payment`,
    );
    return true;
  }
}
