import { Injectable } from '@nestjs/common';
import { Prisma, Tenant, TenantStatus } from '@prisma/client';
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
}
