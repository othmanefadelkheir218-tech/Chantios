import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Conversation, ConversationTopic } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { loadPermissions } from '../../auth/helpers/permission.helper';
import {
  EmailConnectionsService,
  InboxSummary,
} from '../../email-connections/email-connections.service';
import { RolesService } from '../../roles/roles.service';
import { UsersService } from '../../users/users.service';
import { canReadInbox } from '../helpers/chat-access.helper';
import { ConversationRepository } from '../repositories/conversation.repository';

/** The caller, as far as the client-chat rule cares. */
export interface ChatReader {
  userId: number;
  roleId: number;
}

export interface ReadableChat {
  conversation: Conversation;
  inbox: InboxSummary;
}

/**
 * THE reading rule of client chats (doc/notes/client-email.md § Who reads
 * what), for the HTTP routes AND the socket `join`:
 *
 *   - company inbox → every user whose role has `email` view;
 *   - Gmail inbox → ONLY its owner (the admin too gets `404`).
 *
 * A chat the caller may not read, or of another tenant, is `404`: nobody
 * learns that a private chat exists.
 */
@Injectable()
export class ClientChatAccessHandler {
  constructor(
    @InjectPinoLogger(ClientChatAccessHandler.name)
    private readonly logger: PinoLogger,
    private readonly conversations: ConversationRepository,
    private readonly emailConnections: EmailConnectionsService,
    private readonly roles: RolesService,
    private readonly users: UsersService,
  ) {}

  /** The inboxes this caller reads: the company one + their own Gmail ones. */
  async readableInboxes(reader: ChatReader): Promise<InboxSummary[]> {
    const can = await loadPermissions(this.roles, reader.roleId);
    if (!can('email').canView) return [];
    const [company, owned] = await Promise.all([
      this.emailConnections.findCompanySummary(),
      this.emailConnections.findOwnedSummaries(reader.userId),
    ]);
    return [...(company ? [company] : []), ...owned];
  }

  async assertChat(
    conversationId: number,
    reader: ChatReader,
  ): Promise<ReadableChat> {
    const conversation =
      await this.conversations.findClientConversationById(conversationId);
    const inbox = conversation?.inboxId
      ? await this.emailConnections.findSummary(conversation.inboxId)
      : null;
    const canViewEmail = conversation
      ? (await loadPermissions(this.roles, reader.roleId))('email').canView
      : false;
    if (
      !conversation ||
      !inbox ||
      !canReadInbox(inbox, reader.userId, canViewEmail)
    ) {
      this.logger.warn(
        `Client chat ${conversationId} not readable by user ${reader.userId}`,
      );
      throw new NotFoundException('Conversation not found');
    }
    return { conversation, inbox };
  }

  async assertTopic(
    topicId: number,
    reader: ChatReader,
  ): Promise<ReadableChat & { topic: ConversationTopic }> {
    const topic = await this.conversations.findTopicById(topicId);
    if (!topic) {
      this.logger.warn(`Topic ${topicId} not found`);
      throw new NotFoundException('Topic not found');
    }
    const chat = await this.assertChat(topic.conversationId, reader);
    return { ...chat, topic };
  }

  /**
   * Who may CHANGE a topic (its project tag, a moved message): in the shared
   * inbox a user with `email` edit (+ `projects` edit for a tag); in a Gmail
   * inbox the owner only.
   */
  async assertCanEditTopic(
    chat: ReadableChat,
    reader: ChatReader,
    alsoNeedsProjectsEdit: boolean,
  ): Promise<void> {
    if (chat.inbox.kind === 'gmail') {
      if (chat.inbox.ownerUserId === reader.userId) return;
      throw new NotFoundException('Topic not found');
    }
    const can = await loadPermissions(this.roles, reader.roleId);
    if (!can('email').canEdit) {
      throw new ForbiddenException('No edit access to email');
    }
    if (alsoNeedsProjectsEdit && !can('projects').canEdit) {
      throw new ForbiddenException('No edit access to projects');
    }
  }

  /** The socket `join` knows only the user id: read their role first. */
  async assertChatForUser(conversationId: number, userId: number) {
    const user = await this.users.findByIdRaw(userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('Conversation not found');
    }
    return this.assertChat(conversationId, { userId, roleId: user.roleId });
  }
}
