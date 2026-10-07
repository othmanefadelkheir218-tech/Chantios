import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FindSubscriptionsQueryDto } from './dto/find-subscriptions-query.dto';
import { SetPendingPlanDto } from './dto/set-pending-plan.dto';
import { SnapshotUsageInput } from './dto/snapshot-usage.dto';
import { ApplyPendingPlanHandler } from './handlers/apply-pending-plan.handler';
import { CreateSubscriptionHandler } from './handlers/create-subscription.handler';
import { FindAllUsageHandler } from './handlers/find-all-usage.handler';
import { FindSubscriptionHandler } from './handlers/find-subscription.handler';
import { FindSubscriptionsHandler } from './handlers/find-subscriptions.handler';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { SetPendingPlanHandler } from './handlers/set-pending-plan.handler';
import { SetPeriodHandler } from './handlers/set-period.handler';
import { SetStatusHandler } from './handlers/set-status.handler';
import { SnapshotUsageHandler } from './handlers/snapshot-usage.handler';
import { SubscriptionRepository } from './repositories/subscription.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly createSubscription: CreateSubscriptionHandler,
    private readonly findSubscriptions: FindSubscriptionsHandler,
    private readonly findSubscription: FindSubscriptionHandler,
    private readonly setPendingPlan: SetPendingPlanHandler,
    private readonly findUsage: FindUsageHandler,
    private readonly findAllUsage: FindAllUsageHandler,
    private readonly snapshotUsageHandler: SnapshotUsageHandler,
    private readonly setStatusHandler: SetStatusHandler,
    private readonly setPeriodHandler: SetPeriodHandler,
    private readonly applyPendingPlanHandler: ApplyPendingPlanHandler,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  /** Called by step 02 registration, inside its own transaction. */
  create(
    data: Prisma.TenantSubscriptionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.createSubscription.execute(data, tx);
  }

  findAll(query: FindSubscriptionsQueryDto) {
    return this.findSubscriptions.execute(query);
  }

  findByTenant(tenantId: number) {
    return this.findSubscription.execute(tenantId);
  }

  changePlan(tenantId: number, dto: SetPendingPlanDto) {
    return this.setPendingPlan.execute(tenantId, dto);
  }

  usage(tenantId: number, query: PaginationQueryDto) {
    return this.findUsage.execute(tenantId, query);
  }

  /** `GET /api/admin/billing/snapshots` (step 14) — every tenant. */
  allUsage(query: PaginationQueryDto) {
    return this.findAllUsage.execute(query);
  }

  /** Called by the renewal job (step 14). */
  snapshotUsage(input: SnapshotUsageInput) {
    return this.snapshotUsageHandler.execute(input);
  }

  /** Called by the Stripe webhook handlers (step 14). */
  setStatus(
    tenantId: number,
    status: SubscriptionStatus,
    tx?: Prisma.TransactionClient,
  ) {
    return this.setStatusHandler.execute(tenantId, status, tx);
  }

  /** Called by the renewal job and the payment-succeeded webhook (step 14). */
  setPeriod(
    tenantId: number,
    periodStart: Date,
    periodEnd: Date,
    tx?: Prisma.TransactionClient,
  ) {
    return this.setPeriodHandler.execute(tenantId, periodStart, periodEnd, tx);
  }

  /** Called only from inside billing's `run-renewal` (step 14). */
  applyPendingPlan(tenantId: number, tx?: Prisma.TransactionClient) {
    return this.applyPendingPlanHandler.execute(tenantId, tx);
  }

  /**
   * Resolves a Stripe webhook's customer id to a tenant. No business decision
   * to make — a one-line passthrough, same spirit as `findForNotifications`
   * on `tenants` (step 14).
   */
  findByStripeCustomerId(stripeCustomerId: string) {
    return this.subscriptions.findByStripeCustomerId(stripeCustomerId);
  }
}
