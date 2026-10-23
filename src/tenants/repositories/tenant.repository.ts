import { Injectable } from '@nestjs/common';
import { Prisma, Tenant, TenantStatus, VatNumberStatus } from '@prisma/client';
import { env } from '../../config/env.config';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the tenants module talks to the database. */
@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** `tx` — step 02 registration runs this inside its own transaction. */
  create(
    data: Prisma.TenantCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Tenant> {
    return (tx ?? this.prisma).tenant.create({ data });
  }

  async findMany(
    where: Prisma.TenantWhereInput,
    skip: number,
    take: number,
  ): Promise<[Tenant[], number]> {
    return this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.tenant.count({ where }),
    ]);
  }

  findById(id: number): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  }

  /** Step 27 — live companies whose TVA number waits for a VIES answer. */
  async findPendingVatIds(): Promise<number[]> {
    // A `not_checked` number (saved in test mode) is checked too once VIES is on.
    const statuses: VatNumberStatus[] =
      env.VAT_NUMBER_CHECK === 'off' ? ['pending'] : ['pending', 'not_checked'];
    const rows = await this.prisma.tenant.findMany({
      where: { vatNumberStatus: { in: statuses }, deletedAt: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.id);
  }

  /** Every live, active company — the daily and hourly crons walk this list. */
  findAllActive(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { status: 'active', deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  /** Id + name of these companies, deleted ones included (a list must still name them). */
  findNamesByIds(ids: number[]): Promise<{ id: number; name: string }[]> {
    return this.prisma.tenant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  /** Bypasses the soft-delete filter — restore needs to find an already-deleted row. */
  findByIdIncludingDeleted(id: number): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Tenant | null> {
    return (tx ?? this.prisma).tenant.findUnique({ where: { email } });
  }

  update(id: number, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  setStatus(id: number, status: TenantStatus): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data: { status } });
  }

  softDelete(id: number): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restore(id: number): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async softDeleteMany(ids: number[]): Promise<number> {
    const { count } = await this.prisma.tenant.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count;
  }

  async restoreMany(ids: number[]): Promise<number> {
    const { count } = await this.prisma.tenant.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    return count;
  }

  setEmailVerified(id: number): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  /** Called by the media module after a logo upload/replace succeeds. */
  setLogoMediaId(id: number, mediaId: number): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { logoMediaId: mediaId },
    });
  }

  // ---- Platform stats (GET /api/admin/stats) ----

  /** Live companies per status. Deleted companies are left out. */
  async countByStatus(): Promise<{ status: TenantStatus; count: number }[]> {
    const rows = await this.prisma.tenant.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((r) => ({ status: r.status, count: r._count._all }));
  }

  /** New live companies per calendar month (`YYYY-MM`, Brussels time) since `since`. */
  countCreatedPerMonth(
    since: Date,
  ): Promise<{ month: string; count: number }[]> {
    return this.prisma.$queryRaw`
      SELECT to_char(date_trunc('month', created_at AT TIME ZONE 'Europe/Brussels'), 'YYYY-MM') AS month,
             count(*)::int AS count
      FROM tenants
      WHERE deleted_at IS NULL AND created_at >= ${since}
      GROUP BY 1
      ORDER BY 1`;
  }
}
