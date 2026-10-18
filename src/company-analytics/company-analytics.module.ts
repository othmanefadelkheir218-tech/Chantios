import { Module } from '@nestjs/common';
import { TokenModule } from '../auth/token.module';
import { ClientsModule } from '../clients/clients.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { MarginsModule } from '../margins/margins.module';
import { ProjectsModule } from '../projects/projects.module';
import { PurchaseInvoicesModule } from '../purchase-invoices/purchase-invoices.module';
import { QuotesModule } from '../quotes/quotes.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TimeEntriesModule } from '../time-entries/time-entries.module';
import { CompanyAnalyticsController } from './company-analytics.controller';
import { CompanyAnalyticsService } from './company-analytics.service';
import { GetCompanyAnalyticsHandler } from './handlers/get-company-analytics.handler';

/**
 * Step 22 — `GET /api/analytics/overview`. No repository and no table: every
 * number comes from the owning module's service (same shape as the
 * dashboard). Not `src/analytics/`, which is the product-events module.
 */
@Module({
  imports: [
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    ClientsModule,
    ProjectsModule,
    TimeEntriesModule,
    QuotesModule,
    InvoicesModule,
    PurchaseInvoicesModule,
    MarginsModule,
  ],
  controllers: [CompanyAnalyticsController],
  providers: [CompanyAnalyticsService, GetCompanyAnalyticsHandler],
})
export class CompanyAnalyticsModule {}
