import { Injectable } from '@nestjs/common';
import { Prisma, Tenant, TenantStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The only place where the tenants module talks to the database. */
@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return this.prisma.tenant.create({ data });
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

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { email } });
  }

  update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  setStatus(id: string, status: TenantStatus): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data: { status } });
  }
}
