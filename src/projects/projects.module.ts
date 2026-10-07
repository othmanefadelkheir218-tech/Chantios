import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ClientsModule } from '../clients/clients.module';
import { MarginsModule } from '../margins/margins.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesModule } from '../roles/roles.module';
import { StockModule } from '../stock/stock.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ClientProjectsController } from './client-projects.controller';
import { CancelProjectHandler } from './handlers/cancel-project.handler';
import { ChangeStatusHandler } from './handlers/change-status.handler';
import { CreateProjectHandler } from './handlers/create-project.handler';
import { DeleteProjectHandler } from './handlers/delete-project.handler';
import { FindProjectHandler } from './handlers/find-project.handler';
import { FindProjectsHandler } from './handlers/find-projects.handler';
import { StartProgressFromQuoteHandler } from './handlers/start-progress-from-quote.handler';
import { UpdateProjectHandler } from './handlers/update-project.handler';
import { ProjectStatusHistoryRepository } from './repositories/project-status-history.repository';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    AuditModule,
    // These four are what `@TenantAuth()`'s guards need to resolve their own
    // dependencies (TokenHelper, RolesService, SubscriptionsService) — same
    // imports as every other tenant-side module (e.g. `media`, `clients`).
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    // `create-project.handler` validates `client_id` through `ClientsService`
    // (never its repository). One-directional only: projects -> clients —
    // `clients` must never import `projects` back (see
    // `ClientProjectsController` for why).
    ClientsModule,
    // `delete-project.handler` calls `MediaService.deleteAllForEntity`
    // (never its repository) before removing the `projects` row.
    MediaModule,
    // `cancel-project.handler` calls `StockService.releaseByProject` (never
    // its repositories) to release this project's unused reservations.
    StockModule,
    // `change-status` / `cancel-project` write the closure snapshot (and void it
    // on a reopen) through `MarginsService`. One-directional: `margins` is a
    // leaf module and imports nothing from `projects`.
    MarginsModule,
    NotificationsModule, // the project-cancelled reminder
  ],
  controllers: [ProjectsController, ClientProjectsController],
  providers: [
    ProjectsService,
    ProjectRepository,
    ProjectStatusHistoryRepository,
    CreateProjectHandler,
    FindProjectsHandler,
    FindProjectHandler,
    UpdateProjectHandler,
    ChangeStatusHandler,
    CancelProjectHandler,
    DeleteProjectHandler,
    StartProgressFromQuoteHandler,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
