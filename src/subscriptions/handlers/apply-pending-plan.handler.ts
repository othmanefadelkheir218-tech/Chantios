import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * `plan_id = pending_plan_id`, clears both pending columns. A thin,
 * UNCONDITIONAL passthrough to the repository — it does not itself compare
 * `pending_plan_effective_at` to `now`. That date check is
 * `src/billing/handlers/apply-pending-plan-if-due.handler.ts` (deliberately
 * named differently to avoid colliding with this class), which is the only
 * caller (inside `run-renewal`, step 14) and is what makes calling this
 * "never mid-cycle" safe in practice. A no-op when nothing is pending,
 * enforced by the repository.
 */
@Injectable()
export class ApplyPendingPlanHandler {
  constructor(
    @InjectPinoLogger(ApplyPendingPlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  execute(tenantId: number, tx?: Prisma.TransactionClient) {
    this.logger.info(`Applying pending plan for tenant ${tenantId}, if due`);
    return this.subscriptions.applyPendingPlan(tenantId, tx);
  }
}
