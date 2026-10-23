import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';
import { MoveMessageDto } from '../dto/client-chat.dto';
import { toEmailMessageEntity } from '../helpers/client-chat.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';

/**
 * `PATCH /api/client-chats/messages/:messageId/topic` — D3: a wrongly placed
 * RECEIVED email goes to another topic of the SAME chat. Same right as the
 * tag on that inbox (shared: `email` edit; Gmail: the owner). An email we
 * sent, or a topic of another chat → `400`.
 */
@Injectable()
export class MoveMessageTopicHandler {
  constructor(
    @InjectPinoLogger(MoveMessageTopicHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: ClientChatAccessHandler,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly media: MediaService,
  ) {}

  async execute(
    messageId: number,
    dto: MoveMessageDto,
    actor: AuthenticatedUser,
  ) {
    const message = await this.messages.findWithEmail(messageId);
    if (!message?.topicId) {
      throw new NotFoundException('Message not found');
    }
    const chat = await this.access.assertTopic(message.topicId, actor);
    await this.access.assertCanEditTopic(chat, actor, false);
    if (message.email?.direction !== 'inbound') {
      throw new BadRequestException('Only a received email can be moved');
    }

    const target = await this.conversations.findTopicById(dto.topic_id);
    if (!target) throw new NotFoundException('Topic not found');
    if (target.conversationId !== message.conversationId) {
      throw new BadRequestException(
        'An email can only move to a topic of the same chat',
      );
    }
    if (target.id === message.topicId) {
      return toEmailMessageEntity(message);
    }

    const moved = await this.messages.moveToTopic(message.id, target.id);
    if (target.lastMessageAt < message.createdAt) {
      await this.conversations.touchTopic(target.id, message.createdAt);
    }
    this.logger.info(
      `Message ${message.id} moved from topic ${message.topicId} to ${target.id} by user ${actor.userId}`,
    );
    const files = await this.media.findByEntityIds('email_attachment', [
      message.id,
    ]);
    return toEmailMessageEntity(
      { ...moved, email: message.email },
      files.get(message.id) ?? [],
    );
  }
}
