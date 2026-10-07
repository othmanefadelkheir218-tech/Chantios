import { TokenModule } from '../auth/token.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlansModule } from '../plans/plans.module';
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
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [TokenModule, AuditModule, PlansModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionRepository,
    CreateSubscriptionHandler,
    FindSubscriptionsHandler,
    FindSubscriptionHandler,
    SetPendingPlanHandler,
    FindUsageHandler,
    FindAllUsageHandler,
    SnapshotUsageHandler,
    SetStatusHandler,
    SetPeriodHandler,
    ApplyPendingPlanHandler,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
