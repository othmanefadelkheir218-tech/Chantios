import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { EmailConnectionsController } from './email-connections.controller';
import { EmailConnectionsService } from './email-connections.service';
import { DisconnectInboxHandler } from './handlers/disconnect-inbox.handler';
import { FindInboxesHandler } from './handlers/find-inboxes.handler';
import { FinishGmailConnectHandler } from './handlers/finish-gmail-connect.handler';
import { MarkInboxBrokenHandler } from './handlers/mark-inbox-broken.handler';
import { SendThroughInboxHandler } from './handlers/send-through-inbox.handler';
import { SetCompanyAddressHandler } from './handlers/set-company-address.handler';
import { StartGmailConnectHandler } from './handlers/start-gmail-connect.handler';
import { UserEventsListener } from './listeners/user-events.listener';
import { EmailInboxRepository } from './repositories/email-inbox.repository';

/**
 * Step 25 — email inboxes (doc/notes/client-email.md): the company address,
 * the users' own Gmail (connect, send, disconnect) and the address lookup of
 * the inbound webhook. `chat`, `inbound-email` and `billing` call it through
 * `EmailConnectionsService`.
 */
@Module({
  imports: [
    AuditModule,
    EmailModule,
    NotificationsModule,
    UsersModule,
    JwtModule.register({}), // the Google `state` is signed per call
    // What `@TenantAuth()`'s guards need — same as every tenant-side module.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [EmailConnectionsController],
  providers: [
    EmailConnectionsService,
    EmailInboxRepository,
    FindInboxesHandler,
    SetCompanyAddressHandler,
    StartGmailConnectHandler,
    FinishGmailConnectHandler,
    DisconnectInboxHandler,
    MarkInboxBrokenHandler,
    SendThroughInboxHandler,
    UserEventsListener,
  ],
  exports: [EmailConnectionsService],
})
export class EmailConnectionsModule {}
