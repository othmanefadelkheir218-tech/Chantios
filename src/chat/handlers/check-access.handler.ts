import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ChatIdentity, isMemberOf } from '../helpers/chat-access.helper';
import { ConversationWithMembers } from '../helpers/chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';

/**
 * "Is this caller a member of this conversation?" — loaded once, decided by
 * `isMemberOf`, the one implementation. Every HTTP handler AND the socket
 * `join` go through here, so a socket can never see what an HTTP call could not.
 *
 *   - a conversation of another tenant, or an unknown id → `404` (the
 *     tenant-scoped read cannot even see it);
 *   - a conversation of this tenant the caller is not in → `403`.
 */
@Injectable()
export class CheckAccessHandler {
  constructor(
    @InjectPinoLogger(CheckAccessHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
  ) {}

  async assertMember(
    conversationId: number,
    identity: ChatIdentity,
  ): Promise<ConversationWithMembers> {
    const conversation = await this.conversations.findById(conversationId);
    if (!conversation) {
      this.logger.warn(`Conversation ${conversationId} not found`);
      throw new NotFoundException('Conversation not found');
    }
    if (!isMemberOf(conversation.members, identity)) {
      this.logger.warn(
        `Refused: ${JSON.stringify(identity)} is not a member of conversation ${conversationId}`,
      );
      throw new ForbiddenException('You are not a member of this conversation');
    }
    return conversation;
  }
}
