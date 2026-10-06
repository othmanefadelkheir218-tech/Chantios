import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { MarginsModule } from '../margins/margins.module';
import { MediaModule } from '../media/media.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { ServicesModule } from '../services/services.module';
import { StockModule } from '../stock/stock.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CreateReportHandler } from './handlers/create-report.handler';
import { DeclareMaterialsHandler } from './handlers/declare-materials.handler';
import { FindReportsHandler } from './handlers/find-reports.handler';
import { LatestProgressHandler } from './handlers/latest-progress.handler';
import { PrefillMaterialsHandler } from './handlers/prefill-materials.handler';
import { ProjectPhotosHandler } from './handlers/project-photos.handler';
import { ReportAlertsHandler } from './handlers/report-alerts.handler';
import { UpdateReportHandler } from './handlers/update-report.handler';
import { ReportAlertsJob } from './jobs/report-alerts.job';
import { ProjectProgressController } from './project-progress.controller';
import { ReportRepository } from './repositories/report.repository';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    AuditModule,
    ProjectsModule, // validates `project_id` through `ProjectsService`
    StockModule, // the stock door: `declareConsumption` + the recipe walk
    ServicesModule, // validates `service_id`
    MediaModule, // the report's photos
    MarginsModule, // the 80 % / 95 % check after declared material
    // What `@TenantAuth()`'s guards need to resolve their own dependencies.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [ReportsController, ProjectProgressController],
  providers: [
    ReportsService,
    ReportRepository,
    CreateReportHandler,
    FindReportsHandler,
    UpdateReportHandler,
    DeclareMaterialsHandler,
    PrefillMaterialsHandler,
    LatestProgressHandler,
    ProjectPhotosHandler,
    ReportAlertsHandler,
    ReportAlertsJob,
  ],
  // Step 12 (client portal) reads the progress through this service.
  exports: [ReportsService],
})
export class ReportsModule {}
