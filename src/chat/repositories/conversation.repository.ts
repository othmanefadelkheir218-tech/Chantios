import { Injectable } from '@nestjs/common';
import {
  Conversation,
  ConversationTopic,
  ConversationType,
  Prisma,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { newSubjectCode } from '../../common/helpers/subject-code.helper';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatIdentity } from '../helpers/chat-access.helper';
import { ConversationWithMembers } from '../helpers/chat.helper';

const WITH_MEMBERS = { members: true } as const;

/** The only place where the chat module talks to `conversations` and `conversation_members`. */
@Injectable()
export class ConversationRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  /** The conversation and its members, in the caller's transaction (`tx` required). */
  async create(
    data: Prisma.ConversationUncheckedCreateInput,
    members: ChatIdentity[],
    tx: TenantTransactionClient,
  ): Promise<ConversationWithMembers> {
    const conversation = await tx.conversation.create({ data });
    await tx.conversationMember.createMany({
      data: members.map((member) => ({
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
        userId: member.userId ?? null,
        clientId: member.clientId ?? null,
        adminUserId: member.adminUserId ?? null,
      })),
    });
    return tx.conversation.findFirstOrThrow({
      where: { id: conversation.id },
      include: WITH_MEMBERS,
    });
  }

  /** Tenant-scoped: a conversation of another company is simply not found. */
  findById(id: number): Promise<ConversationWithMembers | null> {
    return this.tenantPrisma.db.conversation.findFirst({
      where: { id },
      include: WITH_MEMBERS,
    });
  }

  async findMany(
    where: Prisma.ConversationWhereInput,
    skip: number,
    take: number,
  ): Promise<[ConversationWithMembers[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.conversation.findMany({
        where,
        include: WITH_MEMBERS,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.conversation.count({ where }),
    ]);
  }

  /** The project's one client conversation (`idx_one_client_conversation`), if it exists. */
  findByProject(
    projectId: number,
    type: ConversationType,
  ): Promise<ConversationWithMembers | null> {
    return this.tenantPrisma.db.conversation.findFirst({
      where: { projectId, type },
      include: WITH_MEMBERS,
    });
  }

  /**
   * The 1-to-1 `internal` conversation of two users: no project, exactly these
   * two members. The open one first, else the newest archived one.
   */
  findDirect(
    userId: number,
    otherUserId: number,
  ): Promise<ConversationWithMembers | null> {
    return this.tenantPrisma.db.conversation.findFirst({
      where: {
        type: 'internal',
        projectId: null,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherUserId } } },
          { members: { every: { userId: { in: [userId, otherUserId] } } } },
        ],
      },
      include: WITH_MEMBERS,
      orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * One ticket's `support` conversation, for the TENANT side (the extension
   * scopes it to the caller's own tenant automatically) — step 16's
   * `GET /api/support/tickets/:id`, so the response can carry its
   * `conversation_id`. The cross-tenant admin equivalent is
   * `findByTicketForAdmin` below.
   */
  findByTicket(
    ticketId: number,
    type: ConversationType,
  ): Promise<ConversationWithMembers | null> {
    return this.tenantPrisma.db.conversation.findFirst({
      where: { supportTicketId: ticketId, type },
      include: WITH_MEMBERS,
    });
  }

  /** Archive, never delete. */
  setArchived(id: number, value: boolean): Promise<ConversationWithMembers> {
    return this.tenantPrisma.db.conversation.update({
      where: { id },
      data: { isArchived: value },
      include: WITH_MEMBERS,
    });
  }

  /**
   * Adds one member and returns `true` only if THIS call created the row — the
   * partial unique index (`uq_member_*`) makes adding the same person twice a
   * no-op, so two simultaneous requests cannot write a duplicate.
   */
  async addMember(
    conversationId: number,
    tenantId: number,
    member: ChatIdentity,
    tx?: TenantTransactionClient,
  ): Promise<boolean> {
    const { count } = await (
      tx ?? this.tenantPrisma.db
    ).conversationMember.createMany({
      data: [
        {
          tenantId,
          conversationId,
          userId: member.userId ?? null,
          clientId: member.clientId ?? null,
          adminUserId: member.adminUserId ?? null,
        },
      ],
      skipDuplicates: true,
    });
    return count === 1;
  }

  // ---------------------------------------------------------------------
  // The platform admin's cross-tenant door (decided 2026-10-06,
  // doc/notes/chat-conversations.md). The tenant extension scopes every
  // normal query to ONE tenant, so a platform admin — who has none — reads a
  // support thread through these explicit methods on the UNWRAPPED client.
  // They take the `tenantId` as an argument, they are called ONLY from the
  // handlers behind `AdminAuthGuard`, and those handlers write `audit_logs`
  // on every call. There is no general "turn the extension off" flag.
  // ---------------------------------------------------------------------

  /**
   * The support conversation of one ticket, for THAT tenant only. If the
   * ticket belongs to another tenant, or is not a support thread, nothing
   * matches.
   */
  findByTicketForAdmin(
    ticketId: number,
    tenantId: number,
  ): Promise<ConversationWithMembers | null> {
    return this.prisma.conversation.findFirst({
      where: { supportTicketId: ticketId, tenantId, type: 'support' },
      include: WITH_MEMBERS,
    });
  }

  /** One support conversation by id for a platform admin joining its live room (type and tenant both checked). */
  findSupportByIdForAdmin(
    conversationId: number,
    tenantId: number,
  ): Promise<ConversationWithMembers | null> {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId, type: 'support' },
      include: WITH_MEMBERS,
    });
  }

  /** Adds the replying platform admin as a member (idempotent), unwrapped. */
  async addAdminMemberForAdmin(
    conversationId: number,
    tenantId: number,
    adminUserId: number,
  ): Promise<void> {
    await this.prisma.conversationMember.createMany({
      data: [{ tenantId, conversationId, adminUserId }],
      skipDuplicates: true,
    });
  }

  // ---------------------------------------------------------------------
  // Client conversations and topics (step 25, doc/notes/client-email.md).
  // A `client` conversation = one chat with one client (or unknown contact)
  // in one email inbox. It has no members: who reads it is the inbox rule
  // (`ClientChatAccessHandler`).
  // ---------------------------------------------------------------------

  findClientConversation(
    inboxId: number,
    who: { clientId: number } | { contactEmail: string },
  ): Promise<Conversation | null> {
    return this.tenantPrisma.db.conversation.findFirst({
      where: {
        type: 'client',
        inboxId,
        ...('clientId' in who
          ? { clientId: who.clientId }
          : {
              clientId: null,
              contactEmail: { equals: who.contactEmail, mode: 'insensitive' },
            }),
      },
    });
  }

  /** Find-or-create: two emails at once from a new sender give ONE chat. */
  async ensureClientConversation(data: {
    tenantId: number;
    inboxId: number;
    clientId: number | null;
    contactEmail: string | null;
    contactName: string | null;
  }): Promise<Conversation> {
    const who = data.clientId
      ? { clientId: data.clientId }
      : { contactEmail: data.contactEmail as string };
    const existing = await this.findClientConversation(data.inboxId, who);
    if (existing) return existing;
    try {
      return await this.tenantPrisma.db.conversation.create({
        data: { ...data, type: 'client' },
      });
    } catch (error: unknown) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await this.findClientConversation(data.inboxId, who);
      if (!raced) throw error;
      return raced;
    }
  }

  findClientConversationById(id: number): Promise<Conversation | null> {
    return this.tenantPrisma.db.conversation.findFirst({
      where: { id, type: 'client' },
    });
  }

  /**
   * The client chats matching the filter, newest activity first (the last
   * message of any topic). Returns one page and the total.
   */
  async findClientConversations(
    where: Prisma.ConversationWhereInput,
    skip: number,
    take: number,
  ): Promise<[(Conversation & { lastMessageAt: Date | null })[], number]> {
    const all = await this.tenantPrisma.db.conversation.findMany({
      where: { ...where, type: 'client' },
      select: { id: true },
    });
    if (all.length === 0) return [[], 0];
    const activity = await this.tenantPrisma.db.conversationTopic.groupBy({
      by: ['conversationId'],
      where: { conversationId: { in: all.map((row) => row.id) } },
      _max: { lastMessageAt: true },
    });
    const last = new Map(
      activity.map((row) => [row.conversationId, row._max.lastMessageAt]),
    );
    const ordered = all
      .map((row) => ({ id: row.id, at: last.get(row.id) ?? null }))
      .sort(
        (a, b) =>
          (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0) || b.id - a.id,
      );
    const pageIds = ordered.slice(skip, skip + take).map((row) => row.id);
    const rows = await this.tenantPrisma.db.conversation.findMany({
      where: { id: { in: pageIds } },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return [
      pageIds.flatMap((id) => {
        const row = byId.get(id);
        return row ? [{ ...row, lastMessageAt: last.get(id) ?? null }] : [];
      }),
      all.length,
    ];
  }

  /** "Create client": the contact chat now belongs to the client. */
  moveContactToClient(id: number, clientId: number): Promise<Conversation> {
    return this.tenantPrisma.db.conversation.update({
      where: { id },
      data: { clientId },
    });
  }

  /** The client already had a chat in this inbox: the contact chat joins it. */
  async mergeClientConversation(fromId: number, intoId: number): Promise<void> {
    await this.tenantPrisma.db.$transaction(async (tx) => {
      await tx.conversationTopic.updateMany({
        where: { conversationId: fromId },
        data: { conversationId: intoId },
      });
      await tx.message.updateMany({
        where: { conversationId: fromId },
        data: { conversationId: intoId },
      });
      await tx.conversation.delete({ where: { id: fromId } });
    });
  }

  /**
   * A new topic: a long random reply token and a 6-character subject code
   * (`[#K7Q2M9]`). A collision on either unique index just tries again.
   */
  async createTopic(
    data: {
      tenantId: number;
      conversationId: number;
      subject: string;
      projectId: number | null;
      projectSuggested: boolean;
      createdBy: number | null;
    },
    tx?: TenantTransactionClient,
  ): Promise<ConversationTopic> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await (tx ?? this.tenantPrisma.db).conversationTopic.create({
          data: {
            ...data,
            replyToken: randomBytes(16).toString('hex'),
            subjectCode: newSubjectCode(),
          },
        });
      } catch (error: unknown) {
        if (!isUniqueViolation(error) || attempt >= 3) throw error;
      }
    }
  }

  /**
   * The webhook's reply-token lookup, before any tenant is known — the one
   * unscoped read of topics. It returns the tenant the topic belongs to.
   */
  findTopicByReplyTokenForRouting(token: string): Promise<{
    id: number;
    tenantId: number;
    conversation: { inboxId: number | null };
  } | null> {
    return this.prisma.conversationTopic.findFirst({
      where: { replyToken: token },
      select: {
        id: true,
        tenantId: true,
        conversation: { select: { inboxId: true } },
      },
    });
  }

  /** D3 — a `[#code]` matches a topic of a conversation of this inbox. */
  findTopicBySubjectCode(
    inboxId: number,
    code: string,
  ): Promise<ConversationTopic | null> {
    return this.tenantPrisma.db.conversationTopic.findFirst({
      where: { subjectCode: code, conversation: { inboxId, type: 'client' } },
      orderBy: { id: 'desc' },
    });
  }

  findTopicById(
    id: number,
  ): Promise<(ConversationTopic & { conversation: Conversation }) | null> {
    return this.tenantPrisma.db.conversationTopic.findFirst({
      where: { id },
      include: { conversation: true },
    });
  }

  /** One page of a client chat's email topics, newest activity first. */
  findTopicsPage(
    conversationId: number,
    skip: number,
    take: number,
    search?: string,
  ): Promise<[ConversationTopic[], number]> {
    const where: Prisma.ConversationTopicWhereInput = {
      conversationId,
      ...(search && { subject: { contains: search, mode: 'insensitive' } }),
    };
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.conversationTopic.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.conversationTopic.count({ where }),
    ]);
  }

  setTopicProject(
    id: number,
    projectId: number | null,
    suggested: boolean,
  ): Promise<ConversationTopic> {
    return this.tenantPrisma.db.conversationTopic.update({
      where: { id },
      data: { projectId, projectSuggested: suggested },
    });
  }

  async touchTopic(
    id: number,
    at: Date,
    tx?: TenantTransactionClient,
  ): Promise<void> {
    await (tx ?? this.tenantPrisma.db).conversationTopic.update({
      where: { id },
      data: { lastMessageAt: at },
    });
  }

  /** The topics tagged with a project, in the inboxes the caller may read. */
  async findTopicsByProject(
    projectId: number,
    inboxIds: number[],
    skip: number,
    take: number,
  ): Promise<[(ConversationTopic & { conversation: Conversation })[], number]> {
    const where: Prisma.ConversationTopicWhereInput = {
      projectId,
      conversation: { type: 'client', inboxId: { in: inboxIds } },
    };
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.conversationTopic.findMany({
        where,
        include: { conversation: true },
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.conversationTopic.count({ where }),
    ]);
  }

  /** The client's portal chats (`project_client`), shown as portal topics. */
  findPortalConversationsOfClient(
    clientId: number,
  ): Promise<ConversationWithMembers[]> {
    return this.tenantPrisma.db.conversation.findMany({
      where: { type: 'project_client', members: { some: { clientId } } },
      include: WITH_MEMBERS,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** What a GDPR delete removes — counted for the audit row first. */
  async countClientConversationContent(
    id: number,
  ): Promise<{ topics: number; messages: number }> {
    const [topics, messages] = await this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.conversationTopic.count({
        where: { conversationId: id },
      }),
      this.tenantPrisma.db.message.count({ where: { conversationId: id } }),
    ]);
    return { topics, messages };
  }

  /**
   * GDPR — the only hard delete of messages in the app. The conversation row
   * goes; topics, messages, `message_emails` and reads follow by cascade.
   */
  async deleteClientConversation(
    id: number,
    tx: TenantTransactionClient,
  ): Promise<void> {
    await tx.conversation.delete({ where: { id } });
  }

  /** Which of these clients have a portal chat (the list shows a portal mark). */
  async findClientIdsWithPortal(clientIds: number[]): Promise<Set<number>> {
    if (clientIds.length === 0) return new Set();
    const rows = await this.tenantPrisma.db.conversationMember.findMany({
      where: {
        clientId: { in: clientIds },
        conversation: { type: 'project_client' },
      },
      select: { clientId: true },
      distinct: ['clientId'],
    });
    return new Set(rows.flatMap((row) => (row.clientId ? [row.clientId] : [])));
  }

  /** A chat with no topic left (a first email that could not be sent) goes away. */
  async deleteIfEmpty(conversationId: number): Promise<void> {
    const topics = await this.tenantPrisma.db.conversationTopic.count({
      where: { conversationId },
    });
    if (topics === 0) {
      await this.tenantPrisma.db.conversation.delete({
        where: { id: conversationId },
      });
    }
  }

  /** A topic with no message (its first email could not be sent) goes away. */
  async deleteTopicIfEmpty(topicId: number): Promise<void> {
    const messages = await this.tenantPrisma.db.message.count({
      where: { topicId },
    });
    if (messages === 0) {
      await this.tenantPrisma.db.conversationTopic.delete({
        where: { id: topicId },
      });
    }
  }
}
