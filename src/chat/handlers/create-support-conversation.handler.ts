import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { ChatIdentity } from '../helpers/chat-access.helper';
import { toConversationEntity, toMessageEntity } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';

/**
 * The support module's own transaction (`tenantPrisma.db.$transaction` opened
 * by `create-ticket.handler`) already holds the `support_tickets` row; this
 * handler adds the `type = 'support'` conversation and its first message
 * INSIDE that same `tx`, so a ticket is never left without its thread (the DB
 * check `chk_support_has_ticket` makes the reverse — a support conversation
 * with no ticket — structurally impossible either way).
 *
 * Modeled on `ensure-project-conversation.handler.ts`, with one difference:
 * that handler owns and commits its own transaction; this one does not — the
 * ticket row must be IN the same transaction, so the caller opens it.
 */
@Injectable()
export class CreateSupportConversationHandler {
  constructor(
    @InjectPinoLogger(CreateSupportConversationHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
  ) {}

  async execute(
    ticketId: number,
    members: ChatIdentity[],
    firstMessageContent: string,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ) {
    const created = await this.conversations.create(
      { tenantId: actor.tenantId, type: 'support', supportTicketId: ticketId },
      members,
      tx,
    );
    const message = await this.messages.create(
      {
        tenantId: actor.tenantId,
        conversationId: created.id,
        senderType: 'employee',
        senderId: actor.userId,
        content: firstMessageContent,
      },
      tx,
    );
    this.logger.info(
      `Support conversation ${created.id} created for ticket ${ticketId}, first message ${message.id}`,
    );
    return {
      conversation: toConversationEntity(created),
      message: toMessageEntity(message),
    };
  }
}
