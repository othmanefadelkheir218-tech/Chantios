import { Injectable } from '@nestjs/common';
import { Message, Prisma } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

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
}
