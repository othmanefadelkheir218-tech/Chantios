import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The only place where the categories module talks to the database.
 * `categories.tenant_id` is nullable — a `NULL` row is a shared default
 * seeded at deploy (`prisma/seeds/data.seed.ts`). Reads that must see those
 * defaults go through the raw, unscoped `PrismaService` with an explicit
 * `OR`; the generic `TenantPrismaService` extension would hide every `NULL`
 * row on a read (see `tenant-extension.ts`). Writes go through the
 * tenant-scoped client on purpose — see `findOwnById` below.
 */
@Injectable()
export class CategoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * The shared-defaults reader: `GET /api/categories` — shared defaults
   * (`tenant_id IS NULL`) plus this tenant's own rows. Built by hand on the
   * raw client; never through `TenantPrismaService.db`.
   */
  findVisible(tenantId: number): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { isActive: true, OR: [{ tenantId: null }, { tenantId }] },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * One visible category by id (shared default or this tenant's own) — used
   * by other modules (`services`) to validate a `category_id` on create.
   * Same raw-client reasoning as `findVisible`.
   */
  findVisibleById(id: number, tenantId: number): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { id, OR: [{ tenantId: null }, { tenantId }] },
    });
  }

  create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return this.tenantPrisma.db.category.create({ data });
  }

  /**
   * Own rows only. Goes through the tenant-scoped client on purpose: its
   * extension injects `tenant_id` into the `WHERE`, so a `NULL`-tenant
   * shared default (or another tenant's row) never matches and this simply
   * returns `null` — the structural half of "never edit a default" guard.
   * `update-category.handler` / `archive-category.handler` turn a `null`
   * into a 404.
   */
  findOwnById(id: number): Promise<Category | null> {
    return this.tenantPrisma.db.category.findFirst({ where: { id } });
  }

  update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.tenantPrisma.db.category.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<Category> {
    return this.tenantPrisma.db.category.update({
      where: { id },
      data: { isActive },
    });
  }
}
