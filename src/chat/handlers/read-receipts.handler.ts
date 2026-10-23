import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../../users/users.service';
import { ConversationWithMembers } from '../helpers/chat.helper';
import {
  ReadReceipt,
  countReadReceipts,
  hasReadReceipts,
} from '../helpers/read-receipt.helper';
import { MessageReadRepository } from '../repositories/message-read.repository';

/**
 * Step 26 C — the "seen" info (`read_count` / `member_count`) of some messages
 * of one conversation. Team chat (`internal`) only; any other conversation
 * gets an empty map. Two queries for the whole batch, never one per message:
 * the active members, and the reads.
 */
@Injectable()
export class ReadReceiptsHandler {
  constructor(
    @InjectPinoLogger(ReadReceiptsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reads: MessageReadRepository,
    private readonly users: UsersService,
  ) {}

  async forMessages(
    conversation: ConversationWithMembers,
    messages: Message[],
  ): Promise<Map<number, ReadReceipt>> {
    const ofEmployees = messages.filter((m) => m.senderType === 'employee');
    if (!hasReadReceipts(conversation.type) || ofEmployees.length === 0) {
      return new Map();
    }
    const memberIds = conversation.members
      .map((member) => member.userId)
      .filter((id): id is number => id !== null);
    const [active, reads] = await Promise.all([
      memberIds.length > 0
        ? this.users.findActiveWithRole(memberIds)
        : Promise.resolve([]),
      this.reads.findUserReads(
        ofEmployees.map((m) => m.id),
        conversation.tenantId,
      ),
    ]);
    this.logger.debug(
      `Read receipts of ${ofEmployees.length} message(s) in conversation ${conversation.id}`,
    );
    return countReadReceipts(
      ofEmployees,
      conversation.members,
      new Set(active.map((user) => user.id)),
      reads,
    );
  }
}
