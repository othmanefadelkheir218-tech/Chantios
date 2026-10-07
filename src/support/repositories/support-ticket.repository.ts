import { Injectable } from '@nestjs/common';
import { Prisma, SupportTicket, TicketStatus } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The only place where the support module talks to `support_tickets`. A
 * ticket is a container — all the talking happens in its `support`
 * conversation (`chat` module), never here.
 *
 * Two clients, like `categories`/`chat`'s own admin door: the TENANT side
 * (`create`, `findById`, `findMany`) goes through `TenantPrismaService` —
 * "a tenant sees only their own tickets" is then structural, not a filter
 * that could be forgotten. The PLATFORM side (`findByIdForAdmin`,
 * `findAllForAdmin`, `setStatus`, `assign`, `close`) runs on the raw,
 * unscoped `PrismaService` — an admin route has no tenant in `nestjs-cls` to
 * scope against, and a platform admin must see (and act on) every tenant's
 * tickets. Every admin-side write is called only from a handler behind
 * `AdminAuthGuard`, which writes `audit_logs`.
 */
@Injectable()
export class SupportTicketRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  // ---- Tenant side ----

  create(
    data: Prisma.SupportTicketUncheckedCreateInput,
    tx: TenantTransactionClient,
  ): Promise<SupportTicket> {
    return tx.supportTicket.create({ data });
  }

  /** Tenant-scoped: another company's ticket is simply not found. */
  findById(id: number): Promise<SupportTicket | null> {
    return this.tenantPrisma.db.supportTicket.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.SupportTicketWhereInput,
    skip: number,
    take: number,
  ): Promise<[SupportTicket[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.supportTicket.count({ where }),
    ]);
  }

  // ---- Platform side (unwrapped client, cross-tenant) ----

  findByIdForAdmin(id: number): Promise<SupportTicket | null> {
    return this.prisma.supportTicket.findUnique({ where: { id } });
  }

  async findAllForAdmin(
    where: Prisma.SupportTicketWhereInput,
    skip: number,
    take: number,
  ): Promise<[SupportTicket[], number]> {
    return this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
  }

  setStatus(id: number, status: TicketStatus): Promise<SupportTicket> {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }

  assign(id: number, adminUserId: number): Promise<SupportTicket> {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { assignedAdminId: adminUserId },
    });
  }

  /** Closed, never deleted. */
  close(id: number, closedAt: Date): Promise<SupportTicket> {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: 'closed', closedAt },
    });
  }
}
