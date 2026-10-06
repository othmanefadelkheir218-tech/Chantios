import { Injectable } from '@nestjs/common';
import { CostType, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The only place where the cost-types module talks to the database.
 * `cost_types.tenant_id` is nullable — a `NULL` row is a shared default
 * seeded at deploy. Same rule as `categories` (step 05): reads that must see
 * the defaults use the raw `PrismaService` with an explicit `OR`; writes go
 * through the tenant-scoped client, which can never match a `NULL` row.
 */
@Injectable()
export class CostTypeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  /** The shared-defaults reader: defaults (`tenant_id IS NULL`) + this tenant's own rows. */
  findAllForTenant(tenantId: number): Promise<CostType[]> {
    return this.prisma.costType.findMany({
      where: { isActive: true, OR: [{ tenantId: null }, { tenantId }] },
      orderBy: { name: 'asc' },
    });
  }

  /** One visible cost type by id (default or own) — validates a bill's `cost_type_id`. */
  findVisibleById(id: number, tenantId: number): Promise<CostType | null> {
    return this.prisma.costType.findFirst({
      where: { id, OR: [{ tenantId: null }, { tenantId }] },
    });
  }

  /** Case-insensitive name lookup across defaults + own rows (duplicate guard). */
  findByName(name: string, tenantId: number): Promise<CostType | null> {
    return this.prisma.costType.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        OR: [{ tenantId: null }, { tenantId }],
      },
    });
  }

  create(data: Prisma.CostTypeUncheckedCreateInput): Promise<CostType> {
    return this.tenantPrisma.db.costType.create({ data });
  }

  /**
   * Own rows only — the tenant extension injects `tenant_id` into the
   * `WHERE`, so a `NULL`-tenant default (or another tenant's row) never
   * matches and this returns `null`. The handler turns that into a 404.
   */
  findOwnById(id: number): Promise<CostType | null> {
    return this.tenantPrisma.db.costType.findFirst({ where: { id } });
  }

  update(id: number, data: Prisma.CostTypeUpdateInput): Promise<CostType> {
    return this.tenantPrisma.db.costType.update({ where: { id }, data });
  }
}
