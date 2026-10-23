import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import {
  EmailConnectionsService,
  InboxSummary,
} from '../../email-connections/email-connections.service';
import { ProjectsService } from '../../projects/projects.service';
import { SendNewEmailDto } from '../dto/client-chat.dto';
import { toTopicEntity } from '../helpers/client-chat.helper';
import { decideTopicTag } from '../helpers/topic-project.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';
import { ReplyInTopicHandler } from './reply-in-topic.handler';

/**
 * `POST /api/client-chats/emails` — staff start a new topic (doc/notes/client-email.md
 * § Starting a conversation). `to` = a client (any of its addresses) → that
 * client's chat, else a contact chat. Sent from the inbox given (readable by
 * the caller and active) or the company inbox. Started from a project → that
 * project's tag; the project must belong to that client.
 */
@Injectable()
export class SendNewEmailHandler {
  constructor(
    @InjectPinoLogger(SendNewEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: ClientChatAccessHandler,
    private readonly conversations: ConversationRepository,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly emailConnections: EmailConnectionsService,
    private readonly deliverer: ReplyInTopicHandler,
  ) {}

  async execute(dto: SendNewEmailDto, actor: AuthenticatedUser) {
    const to = dto.to.toLowerCase();
    const inbox = await this.pickInbox(dto.inbox_id, actor);
    const client = await this.clients.findByAnyEmail(to);

    if (dto.project_id) {
      const [project] = await this.projects.findBasics([dto.project_id]);
      if (!project) throw new NotFoundException('Project not found');
      if (!client || project.clientId !== client.id) {
        throw new BadRequestException(
          'The project belongs to another client than this address',
        );
      }
    }
    const tag = decideTopicTag(
      dto.project_id
        ? { kind: 'from_project', projectId: dto.project_id }
        : { kind: 'staff_no_project' },
    );

    const conversation = await this.conversations.ensureClientConversation({
      tenantId: actor.tenantId,
      inboxId: inbox.id,
      clientId: client?.id ?? null,
      contactEmail: client ? null : to,
      contactName: null,
    });
    const topic = await this.conversations.createTopic({
      tenantId: actor.tenantId,
      conversationId: conversation.id,
      subject: dto.subject.trim(),
      projectId: tag.projectId,
      projectSuggested: tag.suggested,
      createdBy: actor.userId,
    });
    this.logger.info(
      `User ${actor.userId} opens topic ${topic.id} with ${to} from inbox ${inbox.id}`,
    );

    try {
      const message = await this.deliverer.deliver(
        {
          topic,
          conversation,
          inbox,
          to,
          content: dto.content,
          mediaIds: dto.media_ids ?? [],
          isReply: false,
        },
        actor,
      );
      return {
        conversationId: conversation.id,
        topic: toTopicEntity(topic, null),
        message,
      };
    } catch (error: unknown) {
      // Nothing was sent: no empty topic (or empty new chat) is left behind.
      await this.conversations.deleteTopicIfEmpty(topic.id);
      await this.conversations.deleteIfEmpty(conversation.id);
      throw error;
    }
  }

  /** The given inbox (readable + active), else the company inbox. */
  private async pickInbox(
    inboxId: number | undefined,
    actor: AuthenticatedUser,
  ): Promise<InboxSummary> {
    if (inboxId === undefined) {
      const company = await this.emailConnections.findCompanySummary();
      if (!company?.address) {
        throw new ConflictException(
          'The company email address is not set yet (Settings → Email)',
        );
      }
      return company;
    }
    const readable = await this.access.readableInboxes(actor);
    const inbox = readable.find((row) => row.id === inboxId);
    if (!inbox) throw new NotFoundException('Inbox not found');
    if (inbox.status !== 'active') {
      throw new ConflictException(
        inbox.kind === 'gmail'
          ? 'Your Gmail is disconnected'
          : 'This inbox cannot send',
      );
    }
    return inbox;
  }
}
