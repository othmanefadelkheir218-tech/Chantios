import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

/**
 * `POST /api/billing/cancel` (`cancel = true`) and `POST /api/billing/resume`
 * (`false`) — doc/notes/subscription-plans.md § Paying by card. A cancel
 * changes nothing now: the app works until the end of the paid month, no
 * refund; then Stripe ends the subscription and the company is blocked
 * (`customer.subscription.deleted`). Before that date it can be undone.
 */
@Injectable()
export class CancelCardSubscriptionHandler {
  constructor(
    @InjectPinoLogger(CancelCardSubscriptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly stripe: StripeService,
  ) {}

  async execute(tenantId: number, cancel: boolean): Promise<void> {
    const action = cancel ? 'cancel' : 'keep';
    this.logger.info(
      `Tenant ${tenantId} asks to ${action} its card subscription`,
    );
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (
      !subscription.stripeSubscriptionId ||
      subscription.status === 'cancelled'
    ) {
      throw new ConflictException('There is no card subscription to change');
    }
    if (subscription.cancelAtPeriodEnd === cancel) {
      this.logger.info(`Tenant ${tenantId}: already set, nothing to do`);
      return;
    }
    const state = await this.stripe.setCancelAtPeriodEnd(
      subscription.stripeSubscriptionId,
      cancel,
    );
    await this.subscriptions.syncStripeSubscription(tenantId, state);
    this.logger.info(
      cancel
        ? `Tenant ${tenantId} subscription ends on ${state.periodEnd.toISOString()}`
        : `Tenant ${tenantId} keeps its subscription`,
    );
  }
}
