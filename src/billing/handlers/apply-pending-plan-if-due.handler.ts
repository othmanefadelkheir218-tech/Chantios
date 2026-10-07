import { Injectable } from '@nestjs/common';
import { TenantSubscription } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

/**
 * Applies a plan move scheduled by `request-downgrade.handler` (or the admin's
 * manual move) ONLY once its effective date has passed — never mid-cycle.
 * Called exclusively from inside `run-renewal.handler`, right after the
 * period has rolled forward, so `now` is that new period's start.
 *
 * Named `...IfDueHandler`, not `ApplyPendingPlanHandler`, to avoid colliding
 * with `src/subscriptions/handlers/apply-pending-plan.handler.ts` — that one
 * is a thin, unconditional passthrough to the repository (safe only because
 * `SetPendingPlanHandler` always sets the effective date to the current
 * `periodEnd`); THIS is the one that actually compares the effective date to
 * `now`.
 */
@Injectable()
export class ApplyPendingPlanIfDueHandler {
  constructor(
    @InjectPinoLogger(ApplyPendingPlanIfDueHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async execute(
    tenantId: number,
    subscription: TenantSubscription,
    now: Date,
  ): Promise<void> {
    if (!subscription.pendingPlanId || !subscription.pendingPlanEffectiveAt) {
      return;
    }
    if (subscription.pendingPlanEffectiveAt > now) {
      this.logger.debug(
        `Tenant ${tenantId} pending plan ${subscription.pendingPlanId} not due yet`,
      );
      return;
    }

    this.logger.info(
      `Applying pending plan ${subscription.pendingPlanId} for tenant ${tenantId}`,
    );
    await this.subscriptions.applyPendingPlan(tenantId);
  }
}
