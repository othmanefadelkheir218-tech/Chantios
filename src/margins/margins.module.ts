import { Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CheckThresholdsHandler } from './handlers/check-thresholds.handler';
import { FindMarginsHandler } from './handlers/find-margins.handler';
import { FindProjectMarginHandler } from './handlers/find-project-margin.handler';
import { FindSnapshotHandler } from './handlers/find-snapshot.handler';
import { MarginBreakdownHandler } from './handlers/margin-breakdown.handler';
import { VoidSnapshotHandler } from './handlers/void-snapshot.handler';
import { WriteSnapshotHandler } from './handlers/write-snapshot.handler';
import { MarginsController } from './margins.controller';
import { MarginsService } from './margins.service';
import { ClosureSnapshotRepository } from './repositories/closure-snapshot.repository';
import { MarginAlertRepository } from './repositories/margin-alert.repository';
import { MarginRepository } from './repositories/margin.repository';

/**
 * A leaf module on purpose: it imports no business module. `projects` (closure)
 * and the cost writers (`time-entries`, `reports`, `purchase-invoices`,
 * `quotes`) all import THIS one, so it must not import any of them back. It
 * reads the live margin through the `project_margin_live` view and one
 * breakdown query — a read model, with `tenant_id` always explicit.
 */
@Module({
  imports: [
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [MarginsController],
  providers: [
    MarginsService,
    MarginRepository,
    ClosureSnapshotRepository,
    MarginAlertRepository,
    FindMarginsHandler,
    FindProjectMarginHandler,
    MarginBreakdownHandler,
    FindSnapshotHandler,
    WriteSnapshotHandler,
    VoidSnapshotHandler,
    CheckThresholdsHandler,
  ],
  exports: [MarginsService],
})
export class MarginsModule {}
