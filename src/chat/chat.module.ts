import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { MediaModule } from '../media/media.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AdminSupportController } from './admin-support.controller';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { AddMemberHandler } from './handlers/add-member.handler';
import { AdminFindSupportMessagesHandler } from './handlers/admin-find-support-messages.handler';
import { AdminJoinSupportHandler } from './handlers/admin-join-support.handler';
import { AdminSendSupportMessageHandler } from './handlers/admin-send-support-message.handler';
import { ArchiveConversationHandler } from './handlers/archive-conversation.handler';
import { CheckAccessHandler } from './handlers/check-access.handler';
import { CreateConversationHandler } from './handlers/create-conversation.handler';
import { EnsureProjectConversationHandler } from './handlers/ensure-project-conversation.handler';
import { FindConversationsHandler } from './handlers/find-conversations.handler';
import { FindMessagesHandler } from './handlers/find-messages.handler';
import { MarkReadHandler } from './handlers/mark-read.handler';
import { SendMessageHandler } from './handlers/send-message.handler';
import { UnreadCountHandler } from './handlers/unread-count.handler';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageReadRepository } from './repositories/message-read.repository';
import { MessageRepository } from './repositories/message.repository';

@Module({
  imports: [
    AuditModule,
    UsersModule, // members must be active users of this tenant
    ProjectsModule, // validates `project_id`; the project's client + manager
    MediaModule, // message attachments (`entity_type = 'message'`)
    // What `@TenantAuth()` / `AdminAuthGuard` / the socket handshake need.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [ChatController, AdminSupportController],
  providers: [
    ChatService,
    ChatGateway,
    ConversationRepository,
    MessageRepository,
    MessageReadRepository,
    CheckAccessHandler,
    CreateConversationHandler,
    FindConversationsHandler,
    FindMessagesHandler,
    SendMessageHandler,
    MarkReadHandler,
    UnreadCountHandler,
    ArchiveConversationHandler,
    AddMemberHandler,
    EnsureProjectConversationHandler,
    AdminFindSupportMessagesHandler,
    AdminSendSupportMessageHandler,
    AdminJoinSupportHandler,
  ],
  // Step 12 (client portal) calls `ChatService.ensureProjectConversation`.
  exports: [ChatService],
})
export class ChatModule {}
