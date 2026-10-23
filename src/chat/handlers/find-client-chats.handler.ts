import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { loadPermissions } from '../../auth/helpers/permission.helper';
import { ClientsService } from '../../clients/clients.service';
import { RolesService } from '../../roles/roles.service';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { MediaService } from '../../media/media.service';
import { ProjectsService } from '../../projects/projects.service';
import {
  FindClientChatsQueryDto,
  FindTopicMessagesQueryDto,
} from '../dto/client-chat.dto';
import {
  buildClientChatFilter,
  toClientChatEntity,
  toEmailMessageEntity,
  toInboxRef,
  toTopicEntity,
} from '../helpers/client-chat.helper';
import { isMemberOf } from '../helpers/chat-access.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageReadRepository } from '../repositories/message-read.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';
import {
  FIRST_TOPICS_PAGE,
  FindChatTopicsHandler,
} from './find-chat-topics.handler';

/**
 * The reads of the Messages "Clients" tab (doc/notes/client-email.md § Where
 * it shows). Every one goes through `ClientChatAccessHandler`: a chat the
 * caller may not read is simply not there.
 */
@Injectable()
export class FindClientChatsHandler {
  constructor(
    @InjectPinoLogger(FindClientChatsHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: ClientChatAccessHandler,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly reads: MessageReadRepository,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly media: MediaService,
    private readonly roles: RolesService,
    private readonly chatTopics: FindChatTopicsHandler,
  ) {}

  /** `GET /api/client-chats` — newest activity first, unread count, email + portal marks. */
  async list(query: FindClientChatsQueryDto, actor: AuthenticatedUser) {
    const inboxes = await this.access.readableInboxes(actor);
    if (inboxes.length === 0)
      return toPaginated([], 0, query.page, query.limit);

    const search = query.search?.trim();
    const clientIds = search ? await this.clients.findIdsMatching(search) : [];
    const where = buildClientChatFilter(
      inboxes.map((inbox) => inbox.id),
      { inboxId: query.inbox_id, search, unknown: query.unknown, clientIds },
    );
    const [rows, total] = await this.conversations.findClientConversations(
      where,
      toSkip(query.page, query.limit),
      query.limit,
    );

    const ids = rows.map((row) => row.id);
    const rowClientIds = rows.flatMap((row) =>
      row.clientId ? [row.clientId] : [],
    );
    const [names, unread, last, withPortal] = await Promise.all([
      this.clients.findNamesByIds([...new Set(rowClientIds)]),
      this.reads.countUnreadForConversations(ids, actor.userId, actor.tenantId),
      this.messages.findLastOfConversations(ids),
      this.conversations.findClientIdsWithPortal(rowClientIds),
    ]);
    const nameOf = new Map(names.map((client) => [client.id, client.name]));
    const inboxOf = new Map(inboxes.map((inbox) => [inbox.id, inbox]));

    this.logger.debug(`User ${actor.userId}: ${total} client chat(s)`);
    return toPaginated(
      rows.map((row) =>
        toClientChatEntity(row, {
          clientName: row.clientId ? (nameOf.get(row.clientId) ?? null) : null,
          inbox: row.inboxId ? (inboxOf.get(row.inboxId) ?? null) : null,
          unread: unread.get(row.id) ?? 0,
          lastMessage: last.get(row.id) ?? null,
          hasPortal: row.clientId ? withPortal.has(row.clientId) : false,
        }),
      ),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * `GET /api/client-chats/:id` — the client (or contact), the inbox, and the
   * topics: the first 20 email topics (`topicsTotal` = all of them, the next
   * pages come from `/topics`) + the client's portal chats as portal topics.
   * `topicId`: that topic too when it is older than the first page.
   */
  async one(
    conversationId: number,
    actor: AuthenticatedUser,
    topicId?: number,
  ) {
    const { conversation, inbox } = await this.access.assertChat(
      conversationId,
      actor,
    );
    const [topics, unread] = await Promise.all([
      this.chatTopics.page(conversation.id, 1, FIRST_TOPICS_PAGE, topicId),
      this.reads.countUnreadForConversations(
        [conversation.id],
        actor.userId,
        actor.tenantId,
      ),
    ]);
    const client = conversation.clientId
      ? await this.clients.findByIdRaw(conversation.clientId)
      : null;
    const extraEmails = client ? await this.clients.listEmails(client.id) : [];
    const portals = client
      ? await this.conversations.findPortalConversationsOfClient(client.id)
      : [];
    const projectIds = portals.flatMap((portal) =>
      portal.projectId ? [portal.projectId] : [],
    );
    const projects = await this.projects.findBasics(projectIds);
    const projectName = new Map(projects.map((p) => [p.id, p.name]));

    return {
      id: conversation.id,
      inbox: toInboxRef(inbox),
      clientId: conversation.clientId,
      client: client
        ? {
            id: client.id,
            name: client.name,
            email: client.email,
            extraEmails: extraEmails.map((row) => row.email),
          }
        : null,
      contactEmail: conversation.contactEmail,
      contactName: conversation.contactName,
      isUnknownContact: conversation.clientId === null,
      readOnly: inbox.status !== 'active',
      unread: unread.get(conversation.id) ?? 0,
      topicsTotal: topics.total,
      topics: [
        ...topics.data,
        ...portals.map((portal) => ({
          id: null,
          channel: 'portal' as const,
          conversationId: portal.id,
          subject: portal.projectId
            ? (projectName.get(portal.projectId) ?? null)
            : null,
          projectId: portal.projectId,
          projectName: portal.projectId
            ? (projectName.get(portal.projectId) ?? null)
            : null,
          projectSuggested: false,
          hasNewAddress: false,
          // Its messages are read through /api/conversations/:id (members only).
          isMember: isMemberOf(portal.members, { userId: actor.userId }),
          isArchived: portal.isArchived,
          createdAt: portal.createdAt,
        })),
      ],
      createdAt: conversation.createdAt,
    };
  }

  /** `GET /api/client-chats/:id/topics/:topicId/messages` — newest first, with the email details. */
  async topicMessages(
    conversationId: number,
    topicId: number,
    query: FindTopicMessagesQueryDto,
    actor: AuthenticatedUser,
  ) {
    const { topic } = await this.access.assertTopic(topicId, actor);
    if (topic.conversationId !== conversationId) {
      throw new NotFoundException('Topic not found');
    }
    const [rows, total] = await this.messages.findTopicMessages(
      topic.id,
      toSkip(query.page, query.limit),
      query.limit,
    );
    const files = await this.media.findByEntityIds(
      'email_attachment',
      rows.map((row) => row.id),
    );
    return toPaginated(
      rows.map((row) => toEmailMessageEntity(row, files.get(row.id) ?? [])),
      total,
      query.page,
      query.limit,
    );
  }

  /** `GET /api/projects/:id/email-topics` — the topics tagged with this project the caller may read. */
  async projectTopics(
    projectId: number,
    query: FindTopicMessagesQueryDto,
    actor: AuthenticatedUser,
  ) {
    const can = await loadPermissions(this.roles, actor.roleId);
    if (!can('projects').canView) {
      throw new ForbiddenException('No view access to projects');
    }
    const [project] = await this.projects.findBasics([projectId]);
    if (!project) throw new NotFoundException('Project not found');
    const inboxes = await this.access.readableInboxes(actor);
    const [rows, total] = await this.conversations.findTopicsByProject(
      projectId,
      inboxes.map((inbox) => inbox.id),
      toSkip(query.page, query.limit),
      query.limit,
    );
    const inboxOf = new Map(inboxes.map((inbox) => [inbox.id, inbox]));
    const clientIds = rows.flatMap((row) =>
      row.conversation.clientId ? [row.conversation.clientId] : [],
    );
    const names = await this.clients.findNamesByIds([...new Set(clientIds)]);
    const nameOf = new Map(names.map((client) => [client.id, client.name]));
    return toPaginated(
      rows.map((row) => ({
        ...toTopicEntity(row, project.name),
        clientName: row.conversation.clientId
          ? (nameOf.get(row.conversation.clientId) ?? null)
          : null,
        contactEmail: row.conversation.contactEmail,
        inbox: (() => {
          const inbox = row.conversation.inboxId
            ? inboxOf.get(row.conversation.inboxId)
            : undefined;
          return inbox ? toInboxRef(inbox) : null;
        })(),
      })),
      total,
      query.page,
      query.limit,
    );
  }
}
