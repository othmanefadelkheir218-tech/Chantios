import { Injectable } from '@nestjs/common';
import { Material, Prisma } from '@prisma/client';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StockLevelRow } from '../helpers/material.helper';

/**
 * The only place where the materials module talks to the database.
 * `material_stock_live` is a Postgres VIEW, not a Prisma model — Prisma does
 * not manage views (doc/Schema Proposal.md § 10). Every read of it goes
 * through `$queryRaw` on the raw, unscoped `PrismaService` with `tenant_id`
 * passed explicitly: the tenant extension only wraps model operations
 * (`findMany`, `update`, ...), never `$queryRaw`.
 */
@Injectable()
export class MaterialRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  create(data: Prisma.MaterialUncheckedCreateInput): Promise<Material> {
    return this.tenantPrisma.db.material.create({ data });
  }

  findById(id: number): Promise<Material | null> {
    return this.tenantPrisma.db.material.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.MaterialWhereInput,
    skip: number,
    take: number,
  ): Promise<[Material[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.material.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.MaterialUpdateInput): Promise<Material> {
    return this.tenantPrisma.db.material.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<Material> {
    return this.tenantPrisma.db.material.update({
      where: { id },
      data: { isActive },
    });
  }

  private currentTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new Error(
        'MaterialRepository raw query ran with no tenant in context',
      );
    }
    return tenantId;
  }

  /** `GET /api/materials` — the list, joined with `material_stock_live`. */
  async findWithStockLevels(
    where: Prisma.MaterialWhereInput,
    skip: number,
    take: number,
  ): Promise<[Array<Material & { stock: StockLevelRow }>, number]> {
    const [materials, total] = await this.findMany(where, skip, take);
    if (materials.length === 0) return [[], total];

    const tenantId = this.currentTenantId();
    const ids = materials.map((m) => m.id);
    const levels = await this.prisma.$queryRaw<StockLevelRow[]>`
      SELECT material_id AS "materialId", on_hand AS "onHand", reserved, available
      FROM material_stock_live
      WHERE tenant_id = ${tenantId} AND material_id IN (${Prisma.join(ids)})
    `;
    const byId = new Map(levels.map((l) => [Number(l.materialId), l]));
    const merged = materials.map((m) => ({
      ...m,
      stock: byId.get(m.id) ?? {
        materialId: m.id,
        onHand: new Prisma.Decimal(0),
        reserved: new Prisma.Decimal(0),
        available: new Prisma.Decimal(0),
      },
    }));
    return [merged, total];
  }

  /** `GET /api/materials/:id` — one material's live stock level. */
  async findStockLevel(materialId: number): Promise<StockLevelRow | null> {
    const tenantId = this.currentTenantId();
    const rows = await this.prisma.$queryRaw<StockLevelRow[]>`
      SELECT material_id AS "materialId", on_hand AS "onHand", reserved, available
      FROM material_stock_live
      WHERE tenant_id = ${tenantId} AND material_id = ${materialId}
    `;
    return rows[0] ?? null;
  }

  /** `GET /api/materials/low-stock` — `on_hand <= minimum_stock`, active materials only. */
  async findLowStock(): Promise<Array<Material & { stock: StockLevelRow }>> {
    const tenantId = this.currentTenantId();
    const rows = await this.prisma.$queryRaw<
      Array<
        Material & {
          onHand: Prisma.Decimal;
          reserved: Prisma.Decimal;
          available: Prisma.Decimal;
        }
      >
    >`
      SELECT
        m.id, m.tenant_id AS "tenantId", m.description, m.unit,
        m.purchase_price AS "purchasePrice", m.minimum_stock AS "minimumStock",
        m.is_active AS "isActive", m.created_at AS "createdAt", m.updated_at AS "updatedAt",
        v.on_hand AS "onHand", v.reserved, v.available
      FROM materials m
      JOIN material_stock_live v ON v.material_id = m.id AND v.tenant_id = m.tenant_id
      WHERE m.tenant_id = ${tenantId} AND m.is_active = true AND v.on_hand <= m.minimum_stock
      ORDER BY m.id
    `;
    return rows.map((row) => ({
      ...row,
      stock: {
        materialId: row.id,
        onHand: row.onHand,
        reserved: row.reserved,
        available: row.available,
      },
    }));
  }
}
