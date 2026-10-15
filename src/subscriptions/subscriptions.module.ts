import { AdminUsersModule } from '../admin-users/admin-users.module';
import { TokenModule } from '../auth/token.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlansModule } from '../plans/plans.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StartGraceHandler } from './handlers/start-grace.handler';
import { ShiftDatesHandler } from './handlers/shift-dates.handler';
import { SyncStripeSubscriptionHandler } from './handlers/sync-stripe-subscription.handler';
import { ApplyPendingPlanHandler } from './handlers/apply-pending-plan.handler';
import { CreateSubscriptionHandler } from './handlers/create-subscription.handler';
import { FindAllUsageHandler } from './handlers/find-all-usage.handler';
import { FindSubscriptionHandler } from './handlers/find-subscription.handler';
import { FindSubscriptionsHandler } from './handlers/find-subscriptions.handler';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { SetPendingPlanHandler } from './handlers/set-pending-plan.handler';
import { MovePendingPlanDateHandler } from './handlers/move-pending-plan-date.handler';
import { SetPeriodHandler } from './handlers/set-period.handler';
import { SetStatusHandler } from './handlers/set-status.handler';
import { SnapshotUsageHandler } from './handlers/snapshot-usage.handler';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    TokenModule,
    AuditModule,
    PlansModule,
    TenantsModule,
    AdminUsersModule,
  ],
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
    MovePendingPlanDateHandler,
    ApplyPendingPlanHandler,
    StartGraceHandler,
    ShiftDatesHandler,
    SyncStripeSubscriptionHandler,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
