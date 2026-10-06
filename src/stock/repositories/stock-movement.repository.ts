import { Injectable } from '@nestjs/common';
import { Prisma, StockMovement } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the stock module talks to the database for
 * `stock_movements` — the ledger. Append-only: no update/delete method
 * exists here on purpose.
 *
 * No `tx` parameter: nothing in this step composes a movement write with
 * another table's write inside one DB transaction (`replaceRecipe` is the
 * only multi-step write this step has, and it is self-contained on
 * `service.repository.ts`). If step 09 ever needs
 * `record-consumption.handler` + `consume-reservation.handler` to be
 * atomic, add it there against these same repositories.
 */
@Injectable()
export class StockMovementRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(
    data: Prisma.StockMovementUncheckedCreateInput,
  ): Promise<StockMovement> {
    return this.tenantPrisma.db.stockMovement.create({ data });
  }

  async createMany(
    rows: Prisma.StockMovementUncheckedCreateInput[],
  ): Promise<number> {
    const { count } = await this.tenantPrisma.db.stockMovement.createMany({
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
