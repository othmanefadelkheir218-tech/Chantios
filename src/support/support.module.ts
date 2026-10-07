import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AssignTicketHandler } from './handlers/assign-ticket.handler';
import { CloseTicketHandler } from './handlers/close-ticket.handler';
import { CreateTicketHandler } from './handlers/create-ticket.handler';
import { FindTicketHandler } from './handlers/find-ticket.handler';
import { FindTicketsAdminHandler } from './handlers/find-tickets-admin.handler';
import { FindTicketsHandler } from './handlers/find-tickets.handler';
import { SetStatusHandler } from './handlers/set-status.handler';
import { SupportTicketRepository } from './repositories/support-ticket.repository';
import { SupportAdminController } from './support-admin.controller';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    AuditModule,
    ChatModule, // the auto-created `support` conversation + its first message
    NotificationsModule, // support_ticket_opened (platform alert)
    // These four are what `@TenantAuth()`'s guards need to resolve their own
    // dependencies (TokenHelper, RolesService, SubscriptionsService) — same
    // imports as every other tenant-side module (e.g. `clients`, `media`).
    // `RolesModule` is also used directly here, for the admin-only check.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [SupportController, SupportAdminController],
  providers: [
    SupportService,
    SupportTicketRepository,
    CreateTicketHandler,
    FindTicketsHandler,
    FindTicketHandler,
    FindTicketsAdminHandler,
    SetStatusHandler,
    AssignTicketHandler,
    CloseTicketHandler,
  ],
})
export class SupportModule {}
