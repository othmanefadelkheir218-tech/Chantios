import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlansModule } from '../plans/plans.module';
import { CreateSubscriptionHandler } from './handlers/create-subscription.handler';
import { FindSubscriptionHandler } from './handlers/find-subscription.handler';
import { FindSubscriptionsHandler } from './handlers/find-subscriptions.handler';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { SetPendingPlanHandler } from './handlers/set-pending-plan.handler';
import { SnapshotUsageHandler } from './handlers/snapshot-usage.handler';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [AuditModule, PlansModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionRepository,
    CreateSubscriptionHandler,
    FindSubscriptionsHandler,
    FindSubscriptionHandler,
    SetPendingPlanHandler,
    FindUsageHandler,
    SnapshotUsageHandler,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
