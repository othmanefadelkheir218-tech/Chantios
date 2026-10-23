import { Injectable } from '@nestjs/common';
import { Client, ClientEmail, Prisma } from '@prisma/client';
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

  /** Id + name of these clients, archived ones included (their old invoices still count). */
  findNamesByIds(ids: number[]): Promise<{ id: number; name: string }[]> {
    return this.tenantPrisma.db.client.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  // ---- client_emails: extra addresses (step 25, doc/notes/client-email.md) ----

  /** The client owning this address (main or extra), case-insensitive. */
  async findByAnyEmail(email: string): Promise<Client | null> {
    const main = await this.tenantPrisma.db.client.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (main) return main;
    const extra = await this.tenantPrisma.db.clientEmail.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { client: true },
    });
    return extra?.client ?? null;
  }

  addEmail(clientId: number, email: string): Promise<ClientEmail> {
    return this.tenantPrisma.db.clientEmail.create({
      data: { clientId, email } as Prisma.ClientEmailUncheckedCreateInput,
    });
  }

  listEmails(clientId: number): Promise<ClientEmail[]> {
    return this.tenantPrisma.db.clientEmail.findMany({
      where: { clientId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Ids of the clients whose name, contact or any email matches (chat search). */
  async findIdsMatching(search: string): Promise<number[]> {
    const rows = await this.tenantPrisma.db.client.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          {
            emails: {
              some: { email: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      },
      select: { id: true },
      take: 200,
    });
    return rows.map((row) => row.id);
  }
}
