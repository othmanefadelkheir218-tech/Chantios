import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ArchiveClientHandler } from './handlers/archive-client.handler';
import { CreateClientHandler } from './handlers/create-client.handler';
import { FindClientHandler } from './handlers/find-client.handler';
import { FindClientsHandler } from './handlers/find-clients.handler';
import { UpdateClientHandler } from './handlers/update-client.handler';
import { ClientRepository } from './repositories/client.repository';

@Module({
  imports: [
    AuditModule,
    // These four are what `@TenantAuth()`'s guards need to resolve their own
    // dependencies (TokenHelper, RolesService, SubscriptionsService) — same
    // imports as every other tenant-side module (e.g. `media`, `users`).
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [ClientsController],
  providers: [
    ClientsService,
    ClientRepository,
    CreateClientHandler,
    FindClientsHandler,
    FindClientHandler,
    UpdateClientHandler,
    ArchiveClientHandler,
  ],
  // `projects` imports this to validate `client_id` through `ClientsService`
  // (never this module's repository) — the one-directional edge that keeps
  // `clients` free to stay ignorant of `projects` (no cycle).
  exports: [ClientsService],
})
export class ClientsModule {}
