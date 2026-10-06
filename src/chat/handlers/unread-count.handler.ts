import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MessageReadRepository } from '../repositories/message-read.repository';

/**
 * `GET /api/conversations/unread-count` — per conversation: the messages with
 * NO matching `message_reads` row for the caller (their own messages are never
 * unread to them). A read, never a stored number. Only conversations that
 * still have something unread are listed.
 */
@Injectable()
export class UnreadCountHandler {
  constructor(
    @InjectPinoLogger(UnreadCountHandler.name)
    private readonly logger: PinoLogger,
    private readonly reads: MessageReadRepository,
  ) {}

  async execute(actor: AuthenticatedUser) {
    this.logger.debug(`Counting unread messages of user ${actor.userId}`);
    const rows = await this.reads.countUnreadByConversation(
      actor.userId,
      actor.tenantId,
    );
    return {
      total: rows.reduce((sum, row) => sum + row.unread, 0),
      conversations: rows,
    };
  }
}
