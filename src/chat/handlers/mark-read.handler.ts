import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ChatGateway } from '../gateways/chat.gateway';
import { MessageReadRepository } from '../repositories/message-read.repository';
import { CheckAccessHandler } from './check-access.handler';

/**
 * `POST /api/conversations/:id/read` — opening a conversation marks every
 * message the caller has not read yet. One row per message per reader, the
 * FIRST time only: the database (`uq_read_user` + `ON CONFLICT DO NOTHING`)
 * makes opening it again, or in two tabs, add nothing. The caller's own
 * messages never get a row. Each newly-read message is announced to the room
 * (`message_read`).
 */
@Injectable()
export class MarkReadHandler {
  constructor(
    @InjectPinoLogger(MarkReadHandler.name)
    private readonly logger: PinoLogger,
    private readonly reads: MessageReadRepository,
    private readonly access: CheckAccessHandler,
    private readonly gateway: ChatGateway,
  ) {}

  async execute(conversationId: number, actor: AuthenticatedUser) {
    await this.access.assertMember(conversationId, { userId: actor.userId });

    const markedIds = await this.reads.markReadForUser(
      conversationId,
      actor.userId,
      actor.tenantId,
    );
    for (const messageId of markedIds) {
      this.gateway.emitMessageRead(conversationId, messageId, {
        type: 'employee',
        id: actor.userId,
      });
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
}
