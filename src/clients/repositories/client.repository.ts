import { Injectable } from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/** The only place where the clients module talks to the database. */
@Injectable()
export class ClientRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(data: Prisma.ClientUncheckedCreateInput): Promise<Client> {
    return this.tenantPrisma.db.client.create({ data });
  }

  findById(id: number): Promise<Client | null> {
    return this.tenantPrisma.db.client.findFirst({ where: { id } });
  }

  /** Unique `(tenant_id, email)` — scoped to the current tenant automatically. */
  findByEmail(email: string): Promise<Client | null> {
    return this.tenantPrisma.db.client.findFirst({ where: { email } });
  }

  async findMany(
    where: Prisma.ClientWhereInput,
    skip: number,
    take: number,
  ): Promise<[Client[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.client.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.tenantPrisma.db.client.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<Client> {
    return this.tenantPrisma.db.client.update({
      where: { id },
      data: { isActive },
    });
  }

  /** The `max_clients` billing dimension (step 14) — called through `ClientsService` only. */
  countActive(): Promise<number> {
    return this.tenantPrisma.db.client.count({ where: { isActive: true } });
  }
}
