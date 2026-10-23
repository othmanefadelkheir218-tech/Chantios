import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { MediaService } from '../../media/media.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

/**
 * `DELETE /api/client-chats/:id` — GDPR, `settings` delete only (the admin).
 * THE ONLY delete of messages in the app (doc/notes/client-email.md § What we
 * save): the files first (ImageKit + rows), then the chat with its topics,
 * messages, email details and reads in one transaction, then one audit row
 * `gdpr_delete` (who, which client, how much). A Gmail chat is deleted by its
 * owner only — the admin cannot even see it.
 */
@Injectable()
export class DeleteClientChatHandler {
  constructor(
    @InjectPinoLogger(DeleteClientChatHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly access: ClientChatAccessHandler,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  async execute(conversationId: number, actor: AuthenticatedUser) {
    const { conversation } = await this.access.assertChat(
      conversationId,
      actor,
    );
    this.logger.info(
      `GDPR delete of client chat ${conversationId} by user ${actor.userId}`,
    );
    const counts =
      await this.conversations.countClientConversationContent(conversationId);
    const messageIds =
      await this.messages.findIdsOfConversation(conversationId);

    const withFiles = await this.media.findByEntityIds(
      'email_attachment',
      messageIds,
    );
    let files = 0;
    for (const messageId of withFiles.keys()) {
      const result = await this.media.deleteAllForEntity(
        'email_attachment',
        messageId,
        actor,
      );
      files += result.deleted.length;
    }
    await this.tenantPrisma.db.$transaction((tx) =>
      this.conversations.deleteClientConversation(conversationId, tx),
    );

    const summary = {
      conversation_id: conversationId,
      client_id: conversation.clientId,
      contact_email: conversation.contactEmail,
      topics: counts.topics,
      messages: counts.messages,
      files,
    };
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'gdpr_delete',
      entityType: 'client_chat',
      entityId: conversationId,
      oldValue: summary,
      ipAddress: null,
    });
    this.logger.info(
      `Client chat ${conversationId} deleted: ${counts.messages} message(s), ${files} file(s)`,
    );
    return { deleted: true, ...summary };
  }
}
