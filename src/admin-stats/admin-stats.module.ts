import { Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SupportModule } from '../support/support.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AdminStatsController } from './admin-stats.controller';
import { AdminStatsService } from './admin-stats.service';
import { GetAdminStatsHandler } from './handlers/get-admin-stats.handler';

/**
 * `GET /api/admin/stats` — the platform home page. No repository and no
 * table: every number comes from the owning module's service. TokenModule is
 * what `AdminAuthGuard` needs.
 */
@Module({
  imports: [
    TokenModule,
    TenantsModule,
    SubscriptionsModule,
    PlansModule,
    SupportModule,
    FeedbackModule,
  ],
  controllers: [AdminStatsController],
  providers: [AdminStatsService, GetAdminStatsHandler],
})
export class AdminStatsModule {}
