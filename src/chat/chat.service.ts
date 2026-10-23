import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequestActor } from '../common/decorators/actor.decorator';
import { TenantTransactionClient } from '../common/prisma/tenant-prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { AdminSendSupportMessageDto } from './dto/admin-send-support-message.dto';
import { AdminSupportQueryDto } from './dto/admin-support-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { FindConversationsQueryDto } from './dto/find-conversations-query.dto';
import { FindMessagesQueryDto } from './dto/find-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AddMemberHandler } from './handlers/add-member.handler';
import { AdminAddSupportMemberHandler } from './handlers/admin-add-support-member.handler';
import { AdminFindSupportMessagesHandler } from './handlers/admin-find-support-messages.handler';
import { AdminSendSupportMessageHandler } from './handlers/admin-send-support-message.handler';
import { ArchiveConversationHandler } from './handlers/archive-conversation.handler';
import { ClientMessagesHandler } from './handlers/client-messages.handler';
import { CreateConversationHandler } from './handlers/create-conversation.handler';
import { CreateSupportConversationHandler } from './handlers/create-support-conversation.handler';
import { EnsureProjectConversationHandler } from './handlers/ensure-project-conversation.handler';
import { FindConversationsHandler } from './handlers/find-conversations.handler';
import { FindMessagesHandler } from './handlers/find-messages.handler';
import { FindSupportConversationHandler } from './handlers/find-support-conversation.handler';
import { MarkReadHandler } from './handlers/mark-read.handler';
import { SendMessageHandler } from './handlers/send-message.handler';
import { UnreadCountHandler } from './handlers/unread-count.handler';
import { FindContactsHandler } from './handlers/find-contacts.handler';
import { ReceiveInboundEmailHandler } from './handlers/receive-inbound-email.handler';
import { InboundEmailInput } from './dto/inbound-email-input.dto';
import { ConversationRepository } from './repositories/conversation.repository';
import { ChatIdentity } from './helpers/chat-access.helper';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ChatService {
  constructor(
    private readonly createConversation: CreateConversationHandler,
    private readonly findConversations: FindConversationsHandler,
    private readonly findMessages: FindMessagesHandler,
    private readonly sendMessage: SendMessageHandler,
    private readonly markRead: MarkReadHandler,
    private readonly unreadCount: UnreadCountHandler,
    private readonly findContacts: FindContactsHandler,
    private readonly archiveConversation: ArchiveConversationHandler,
    private readonly addMember: AddMemberHandler,
    private readonly ensureProjectConversationHandler: EnsureProjectConversationHandler,
    private readonly adminFindSupport: AdminFindSupportMessagesHandler,
    private readonly adminSendSupport: AdminSendSupportMessageHandler,
    private readonly clientMessages: ClientMessagesHandler,
    private readonly createSupportConversationHandler: CreateSupportConversationHandler,
    private readonly findSupportConversationHandler: FindSupportConversationHandler,
    private readonly adminAddSupportMember: AdminAddSupportMemberHandler,
    private readonly receiveInboundEmailHandler: ReceiveInboundEmailHandler,
    private readonly conversations: ConversationRepository,
  ) {}

  create(dto: CreateConversationDto, actor: AuthenticatedUser) {
    return this.createConversation.execute(dto, actor);
  }

  findAll(query: FindConversationsQueryDto, actor: AuthenticatedUser) {
    return this.findConversations.execute(query, actor);
  }

  findOne(id: number, actor: AuthenticatedUser) {
    return this.findConversations.findOne(id, actor);
  }

  messages(id: number, query: FindMessagesQueryDto, actor: AuthenticatedUser) {
    return this.findMessages.execute(id, query, actor);
  }

  send(id: number, dto: SendMessageDto, actor: AuthenticatedUser) {
    return this.sendMessage.execute(id, dto, actor);
  }

  read(id: number, actor: AuthenticatedUser) {
    return this.markRead.execute(id, actor);
  }

  unread(actor: AuthenticatedUser) {
    return this.unreadCount.execute(actor);
  }

  contacts(actor: AuthenticatedUser) {
    return this.findContacts.execute(actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveConversation.execute(id, actor);
  }

  members(id: number, dto: AddMemberDto, actor: AuthenticatedUser) {
    return this.addMember.execute(id, dto, actor);
  }

  // ---- The platform admin's cross-tenant support door (behind AdminAuthGuard) ----

  adminReadSupport(
    ticketId: number,
    query: AdminSupportQueryDto,
    actor: RequestActor,
  ) {
    return this.adminFindSupport.execute(ticketId, query, actor);
  }

  adminReplySupport(
    ticketId: number,
    tenantId: number,
    dto: AdminSendSupportMessageDto,
    actor: RequestActor,
  ) {
    return this.adminSendSupport.execute(ticketId, tenantId, dto, actor);
  }

  // ---- Internal API for step 12 (client portal) ----

  /**
   * Find-or-create the ONE `project_client` conversation of a project.
   * Idempotent — step 12 calls it every time a portal link is generated.
   */
  ensureProjectConversation(projectId: number, actor: AuthenticatedUser) {
    return this.ensureProjectConversationHandler.execute(projectId, actor);
  }

  /** The client's messages on a project (the portal): newest first, opening marks them read for the client. */
  listClientMessages(
    projectId: number,
    clientId: number,
    tenantId: number,
    query: FindMessagesQueryDto,
  ) {
    return this.clientMessages.list(projectId, clientId, tenantId, query);
  }

  /** The client writes on a project (the portal): `sender_type = 'client'`, `sender_id = client_id`. */
  sendClientMessage(
    projectId: number,
    clientId: number,
    content: string,
    mediaIds: number[] = [],
  ) {
    return this.clientMessages.send(projectId, clientId, content, mediaIds);
  }

  /** The checks of `sendClientMessage`, without writing — run before the client's files are uploaded. */
  async assertClientCanSend(
    projectId: number,
    clientId: number,
    content: string,
  ): Promise<void> {
    await this.clientMessages.assertCanSend(projectId, clientId, content);
  }

  // ---- Internal API for step 16 (support tickets) ----

  /**
   * One transaction (opened by `create-ticket.handler`, step 16): the
   * `type = 'support'` conversation and its first message, in `tx`.
   */
  createSupportConversation(
    ticketId: number,
    members: ChatIdentity[],
    firstMessageContent: string,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ) {
    return this.createSupportConversationHandler.execute(
      ticketId,
      members,
      firstMessageContent,
      actor,
      tx,
    );
  }

  /** One ticket's `support` conversation, tenant-scoped — for `GET /api/support/tickets/:id`. */
  findSupportConversationByTicket(ticketId: number) {
    return this.findSupportConversationHandler.byTicket(ticketId);
  }

  /** The newly assigned platform admin joins the ticket's conversation (cross-tenant door, idempotent). */
  addAdminToSupportConversation(
    ticketId: number,
    tenantId: number,
    adminUserId: number,
  ) {
    return this.adminAddSupportMember.execute(ticketId, tenantId, adminUserId);
  }

  // ---- Internal API for step 25 (inbound-email) ----

  /**
   * The webhook's `reply-<token>@…` lookup, before any tenant is known: the
   * topic and the tenant + inbox it belongs to, or null.
   */
  async findReplyTopic(token: string) {
    const topic =
      await this.conversations.findTopicByReplyTokenForRouting(token);
    return topic && topic.conversation.inboxId
      ? {
          topicId: topic.id,
          tenantId: topic.tenantId,
          inboxId: topic.conversation.inboxId,
        }
      : null;
  }

  /** One received email → a message of a client chat. Null = already saved. */
  receiveInboundEmail(input: InboundEmailInput) {
    return this.receiveInboundEmailHandler.execute(input);
  }
}
