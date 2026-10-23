import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ChatGateway } from '../gateways/chat.gateway';
import { MessageReadRepository } from '../repositories/message-read.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

/**
 * `POST /api/client-chats/:id/read` — every message of the chat is read for
 * the caller (one row per message per reader, the first time only — the same
 * one-statement insert as the team chat).
 */
@Injectable()
export class MarkClientChatReadHandler {
  constructor(
    @InjectPinoLogger(MarkClientChatReadHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: ClientChatAccessHandler,
    private readonly reads: MessageReadRepository,
    private readonly gateway: ChatGateway,
  ) {}

  async execute(conversationId: number, actor: AuthenticatedUser) {
    await this.access.assertChat(conversationId, actor);
    const marked = await this.reads.markReadForUser(
      conversationId,
      actor.userId,
      actor.tenantId,
    );
    for (const messageId of marked) {
      this.gateway.emitMessageRead(conversationId, messageId, {
        type: 'employee',
        id: actor.userId,
      });
    }
    this.logger.info(
      `User ${actor.userId} read client chat ${conversationId}: ${marked.length} newly read`,
    );
    return { conversationId, marked: marked.length, unread: 0 };
  }
}
