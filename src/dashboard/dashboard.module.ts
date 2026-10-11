import { Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { MarginsModule } from '../margins/margins.module';
import { MaterialsModule } from '../materials/materials.module';
import { ProjectsModule } from '../projects/projects.module';
import { PurchaseInvoicesModule } from '../purchase-invoices/purchase-invoices.module';
import { QuotesModule } from '../quotes/quotes.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TasksModule } from '../tasks/tasks.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { GetDashboardHandler } from './handlers/get-dashboard.handler';

/**
 * Step 18 — `GET /api/dashboard`. No repository and no table: every number
 * comes from the owning module's service. Token, Roles, Subscriptions and
 * Tenants are what `@TenantAuth()`'s guards need (Tenants also gives the timezone).
 */
@Module({
  imports: [
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
    QuotesModule,
    InvoicesModule,
    PurchaseInvoicesModule,
    MaterialsModule,
    MarginsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, GetDashboardHandler],
})
export class DashboardModule {}
