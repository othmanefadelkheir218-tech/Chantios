import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { FindSubscriptionsQueryDto } from './dto/find-subscriptions-query.dto';
import { SetPendingPlanDto } from './dto/set-pending-plan.dto';
import { SnapshotUsageInput } from './dto/snapshot-usage.dto';
import { CreateSubscriptionHandler } from './handlers/create-subscription.handler';
import { FindSubscriptionHandler } from './handlers/find-subscription.handler';
import { FindSubscriptionsHandler } from './handlers/find-subscriptions.handler';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { SetPendingPlanHandler } from './handlers/set-pending-plan.handler';
import { SnapshotUsageHandler } from './handlers/snapshot-usage.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly createSubscription: CreateSubscriptionHandler,
    private readonly findSubscriptions: FindSubscriptionsHandler,
    private readonly findSubscription: FindSubscriptionHandler,
    private readonly setPendingPlan: SetPendingPlanHandler,
    private readonly findUsage: FindUsageHandler,
    private readonly snapshotUsageHandler: SnapshotUsageHandler,
  ) {}

  /** Called by step 02 registration. */
  create(data: Prisma.TenantSubscriptionUncheckedCreateInput) {
    return this.createSubscription.execute(data);
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

  /** Called by the renewal job (step 14). */
  snapshotUsage(input: SnapshotUsageInput) {
    return this.snapshotUsageHandler.execute(input);
  }
}
