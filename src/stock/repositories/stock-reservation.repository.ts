import { Injectable } from '@nestjs/common';
import { Prisma, StockReservation } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the stock module talks to the database for
 * `stock_reservations`. No `tx` parameter — see `stock-movement.repository.ts`
 * for why.
 */
@Injectable()
export class StockReservationRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * `UNIQUE (project_id, material_id)` — a real, atomic `upsert`: a second
   * accepted quote on the same project adds to both quantity columns via
   * Prisma's `increment`, it never creates a duplicate row or needs a
   * find-then-branch race. Always brings `status` back to `active` — even a
   * previously `released`/`consumed` row is live again once more is
   * reserved against it.
   */
  upsertAdd(
    projectId: number,
    materialId: number,
    quantity: string,
    tenantId: number,
  ): Promise<StockReservation> {
    return this.tenantPrisma.db.stockReservation.upsert({
      where: { projectId_materialId: { projectId, materialId } },
      create: {
        tenantId,
        projectId,
        materialId,
        reservedQuantity: quantity,
        remainingQuantity: quantity,
        status: 'active',
      },
      update: {
        reservedQuantity: { increment: quantity },
        remainingQuantity: { increment: quantity },
        status: 'active',
      },
    });
  }

  findByProject(projectId: number): Promise<StockReservation[]> {
    return this.tenantPrisma.db.stockReservation.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });
  }

  findByMaterial(materialId: number): Promise<StockReservation[]> {
    return this.tenantPrisma.db.stockReservation.findMany({
      where: { materialId },
      orderBy: { id: 'asc' },
    });
  }

  /** The one active reservation for a (project, material) pair, if any. */
  findOne(
    projectId: number,
    materialId: number,
  ): Promise<StockReservation | null> {
    return this.tenantPrisma.db.stockReservation.findFirst({
      where: { projectId, materialId },
    });
  }

  async findMany(
    where: Prisma.StockReservationWhereInput,
    skip: number,
    take: number,
  ): Promise<[StockReservation[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.stockReservation.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.stockReservation.count({ where }),
    ]);
  }

  /**
   * Lowers `remaining_quantity` only — `reserved_quantity` (the original
   * ask) never moves. Clamped at 0 (consumption can exceed the estimate —
   * the recipe is theory, real usage is truth). `status` flips to
   * `consumed` exactly when `remaining_quantity` reaches 0.
   */
  async decrementRemaining(
    projectId: number,
    materialId: number,
    quantity: string,
  ): Promise<StockReservation | null> {
    const current = await this.tenantPrisma.db.stockReservation.findFirst({
      where: { projectId, materialId },
    });
    if (!current) return null;

    const newRemaining = Prisma.Decimal.max(
      0,
      new Prisma.Decimal(current.remainingQuantity).minus(quantity),
    );
    return this.tenantPrisma.db.stockReservation.update({
      where: { id: current.id },
      data: {
        remainingQuantity: newRemaining,
        status: newRemaining.equals(0) ? 'consumed' : current.status,
      },
    });
  }

  /** Every `active` reservation of a project → `released`, `remaining_quantity = 0`. */
  async releaseByProject(projectId: number): Promise<number> {
    const { count } = await this.tenantPrisma.db.stockReservation.updateMany({
      where: { projectId, status: 'active' },
      data: { status: 'released', remainingQuantity: 0 },
    });
    return count;
  }
}
