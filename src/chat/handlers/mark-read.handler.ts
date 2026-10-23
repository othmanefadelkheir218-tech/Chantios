import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ChatGateway } from '../gateways/chat.gateway';
import { ReadReceipt, hasReadReceipts } from '../helpers/read-receipt.helper';
import { MessageReadRepository } from '../repositories/message-read.repository';
import { MessageRepository } from '../repositories/message.repository';
import { CheckAccessHandler } from './check-access.handler';
import { ReadReceiptsHandler } from './read-receipts.handler';

/**
 * `POST /api/conversations/:id/read` — opening a conversation marks every
 * message the caller has not read yet. One row per message per reader, the
 * FIRST time only: the database (`uq_read_user` + `ON CONFLICT DO NOTHING`)
 * makes opening it again, or in two tabs, add nothing. The caller's own
 * messages never get a row. Each newly-read message is announced to the room
 * (`message_read`). In the team chat the event also carries the message's
 * new `read_count` / `member_count` (step 26 C), so the sender sees ✓✓ live.
 * The frontend calls this again on every `new_message` while the chat is open.
 */
@Injectable()
export class MarkReadHandler {
  constructor(
    @InjectPinoLogger(MarkReadHandler.name)
    private readonly logger: PinoLogger,
    private readonly reads: MessageReadRepository,
    private readonly messages: MessageRepository,
    private readonly receipts: ReadReceiptsHandler,
    private readonly access: CheckAccessHandler,
    private readonly gateway: ChatGateway,
  ) {}

  async execute(conversationId: number, actor: AuthenticatedUser) {
    const conversation = await this.access.assertMember(conversationId, {
      userId: actor.userId,
    });

    const markedIds = await this.reads.markReadForUser(
      conversationId,
      actor.userId,
      actor.tenantId,
    );
    const receipts = await this.receiptsOf(conversation, markedIds);
    for (const messageId of markedIds) {
      this.gateway.emitMessageRead(
        conversationId,
        messageId,
        { type: 'employee', id: actor.userId },
        receipts.get(messageId),
      );
    }
    const unread = await this.reads.countUnread(
      conversationId,
      actor.userId,
      actor.tenantId,
    );
    this.logger.info(
      `User ${actor.userId} read conversation ${conversationId}: ${markedIds.length} newly read, ${unread} unread`,
    );
    return { conversationId, marked: markedIds.length, unread };
  }

  /** The new counts of the messages just read — team chat only, one batch. */
  private async receiptsOf(
    conversation: Awaited<ReturnType<CheckAccessHandler['assertMember']>>,
    markedIds: number[],
  ) {
    if (markedIds.length === 0 || !hasReadReceipts(conversation.type)) {
      return new Map<number, ReadReceipt>();
    }
    const marked = await this.messages.findByIds(conversation.id, markedIds);
    return this.receipts.forMessages(conversation, marked);
  }
}
