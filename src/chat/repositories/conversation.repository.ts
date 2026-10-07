import { Injectable } from '@nestjs/common';
import { ConversationType, Prisma } from '@prisma/client';
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
}
