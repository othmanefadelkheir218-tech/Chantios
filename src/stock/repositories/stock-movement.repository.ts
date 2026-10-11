import { Injectable } from '@nestjs/common';
import { Prisma, StockMovement } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the stock module talks to the database for
 * `stock_movements` — the ledger. Append-only: no update/delete method
 * exists here on purpose.
 *
 * `create` and `createMany` take an optional `tx` for the callers that
 * write movements inside a wider transaction (site reports, bulk import).
 */
@Injectable()
export class StockMovementRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * `tx` — step 09's `declare-materials` writes one consumption row per item
   * inside a single transaction, so a failure on item 3 leaves nothing of
   * items 1 and 2.
   */
  create(
    data: Prisma.StockMovementUncheckedCreateInput,
    tx?: TenantTransactionClient,
  ): Promise<StockMovement> {
    return (tx ?? this.tenantPrisma.db).stockMovement.create({ data });
  }

  /** `tx` — a bulk import writes all its movements inside one transaction. */
  async createMany(
    rows: Prisma.StockMovementUncheckedCreateInput[],
    tx?: TenantTransactionClient,
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const { count } = await (
      tx ?? this.tenantPrisma.db
    ).stockMovement.createMany({
      data: rows,
    });
    return count;
  }

  async findMany(
    where: Prisma.StockMovementWhereInput,
    skip: number,
    take: number,
  ): Promise<[StockMovement[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.stockMovement.count({ where }),
    ]);
  }

  /** Step 10's margin: total material cost for a project (consumption rows are negative). */
  async sumByProject(projectId: number): Promise<Prisma.Decimal> {
    const result = await this.tenantPrisma.db.stockMovement.aggregate({
      where: { projectId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? new Prisma.Decimal(0);
  }
}
