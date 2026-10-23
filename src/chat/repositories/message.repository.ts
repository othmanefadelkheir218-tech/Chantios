import { Injectable } from '@nestjs/common';
import { Message, MessageEmail, Prisma } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

export type MessageWithEmail = Message & { email: MessageEmail | null };

/** The only place where the chat module talks to `messages`. Messages are archived, never deleted. */
@Injectable()
export class MessageRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  /** `tx` — a message and its attachments are written in one transaction. */
  create(
    data: Prisma.MessageUncheckedCreateInput,
    tx?: TenantTransactionClient,
  ): Promise<Message> {
    return (tx ?? this.tenantPrisma.db).message.create({ data });
  }

  findById(id: number): Promise<Message | null> {
    return this.tenantPrisma.db.message.findFirst({ where: { id } });
  }

  /** These messages of one conversation (step 26 C — the ones just marked read). */
  findByIds(conversationId: number, ids: number[]): Promise<Message[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.tenantPrisma.db.message.findMany({
      where: { conversationId, id: { in: ids } },
    });
  }

  /** Newest first. Archived messages stay out of the normal read. */
  async findMany(
    conversationId: number,
    skip: number,
    take: number,
  ): Promise<[Message[], number]> {
    const where = { conversationId, isArchived: false };
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.message.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.message.count({ where }),
    ]);
  }

  // The platform admin's cross-tenant door — see `conversation.repository.ts`.
  // Unwrapped client, explicit `tenantId`, called only from handlers behind
  // `AdminAuthGuard` that write `audit_logs`.

  async findManyForAdmin(
    conversationId: number,
    tenantId: number,
    skip: number,
    take: number,
  ): Promise<[Message[], number]> {
    const where = { conversationId, tenantId, isArchived: false };
    return this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.message.count({ where }),
    ]);
  }

  /** A platform staff reply; `tenant_id` is the conversation's, set explicitly. */
  createForAdmin(data: Prisma.MessageUncheckedCreateInput): Promise<Message> {
    return this.prisma.message.create({ data });
  }

  // ---------------------------------------------------------------------
  // Email messages (step 25, doc/notes/client-email.md). An email message is
  // a `messages` row in a topic + its `message_emails` row.
  // ---------------------------------------------------------------------

  /** The message and its email details, in the caller's transaction. */
  async createEmailMessage(
    message: Prisma.MessageUncheckedCreateInput,
    email: Omit<Prisma.MessageEmailUncheckedCreateInput, 'messageId'>,
    tx: TenantTransactionClient,
  ): Promise<MessageWithEmail> {
    const created = await tx.message.create({ data: message });
    await tx.messageEmail.create({
      data: { ...email, messageId: created.id },
    });
    return tx.message.findFirstOrThrow({
      where: { id: created.id },
      include: { email: true },
    });
  }

  findWithEmail(id: number): Promise<MessageWithEmail | null> {
    return this.tenantPrisma.db.message.findFirst({
      where: { id },
      include: { email: true },
    });
  }

  /** One topic's messages, newest first, with their email details. */
  async findTopicMessages(
    topicId: number,
    skip: number,
    take: number,
  ): Promise<[MessageWithEmail[], number]> {
    const where = { topicId, isArchived: false };
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.message.findMany({
        where,
        include: { email: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.tenantPrisma.db.message.count({ where }),
    ]);
  }

  /**
   * D3 — the topic of the newest email of THIS inbox whose `Message-ID` is in
   * a reply's `References` / `In-Reply-To`.
   */
  async findTopicByHeaderIds(
    inboxId: number,
    headerIds: string[],
  ): Promise<number | null> {
    if (headerIds.length === 0) return null;
    const row = await this.tenantPrisma.db.messageEmail.findFirst({
      where: { inboxId, headerMessageId: { in: headerIds } },
      orderBy: { createdAt: 'desc' },
      select: { message: { select: { topicId: true } } },
    });
    return row?.message.topicId ?? null;
  }

  /** The client's emails of one topic, oldest first (for the thread headers). */
  findInboundEmailsOfTopic(topicId: number) {
    return this.tenantPrisma.db.messageEmail.findMany({
      where: { direction: 'inbound', message: { topicId } },
      orderBy: { createdAt: 'asc' },
      select: { headerMessageId: true, fromAddress: true, subject: true },
    });
  }

  /** Same Resend email twice (a webhook redelivered): one message only. */
  async existsResendEmail(resendEmailId: string): Promise<boolean> {
    const count = await this.tenantPrisma.db.messageEmail.count({
      where: { resendEmailId, direction: 'inbound' },
    });
    return count > 0;
  }

  /** D3 — a wrongly placed email goes to another topic of the same chat. */
  moveToTopic(id: number, topicId: number): Promise<Message> {
    return this.tenantPrisma.db.message.update({
      where: { id },
      data: { topicId },
    });
  }

  /** The newest message of each conversation, for the chat list preview. */
  async findLastOfConversations(
    conversationIds: number[],
  ): Promise<Map<number, MessageWithEmail>> {
    if (conversationIds.length === 0) return new Map();
    const rows = await this.tenantPrisma.db.message.findMany({
      where: { conversationId: { in: conversationIds }, isArchived: false },
      include: { email: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      distinct: ['conversationId'],
    });
    return new Map(rows.map((row) => [row.conversationId, row]));
  }

  /** Ids of every message of a conversation — its files go in a GDPR delete. */
  async findIdsOfConversation(conversationId: number): Promise<number[]> {
    const rows = await this.tenantPrisma.db.message.findMany({
      where: { conversationId },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }

  /** Inbound emails of a topic flagged "new address" from this address: no longer new. */
  async clearNewAddressFlag(conversationId: number, address: string) {
    await this.tenantPrisma.db.messageEmail.updateMany({
      where: {
        newAddress: true,
        fromAddress: { equals: address, mode: 'insensitive' },
        message: { conversationId },
      },
      data: { newAddress: false },
    });
  }

  /** After the files are saved: the HTML with real image URLs + the skipped list (D2). */
  async updateEmailContent(
    messageId: number,
    html: string | null,
    skipped: { filename: string; reason: string }[],
  ): Promise<void> {
    await this.tenantPrisma.db.messageEmail.update({
      where: { messageId },
      data: { html, skippedAttachments: skipped as Prisma.InputJsonValue },
    });
  }

  /** The topics of a chat holding an email from a new address (the warning sign). */
  async findTopicIdsWithNewAddress(
    conversationId: number,
  ): Promise<Set<number>> {
    const rows = await this.tenantPrisma.db.message.findMany({
      where: { conversationId, email: { newAddress: true } },
      select: { topicId: true },
      distinct: ['topicId'],
    });
    return new Set(rows.flatMap((row) => (row.topicId ? [row.topicId] : [])));
  }
}
