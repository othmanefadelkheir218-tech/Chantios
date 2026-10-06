import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { SnapshotWithCosts } from '../helpers/margin.helper';

const WITH_COSTS = { costs: { include: { costType: true } } } as const;

/**
 * The only place where the margins module touches `project_closure_snapshots`
 * and its cost rows. A snapshot is a financial record: there is no update and
 * no delete — only `create` and `void`.
 */
@Injectable()
export class ClosureSnapshotRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * The snapshot and ONE cost row per cost type, in the caller's transaction
   * (`tx` required) — it is written together with the status change, or not
   * at all.
   */
  async create(
    data: Prisma.ProjectClosureSnapshotUncheckedCreateInput,
    costRows: { costTypeId: number; amount: Prisma.Decimal }[],
    tx: TenantTransactionClient,
  ): Promise<SnapshotWithCosts> {
    const snapshot = await tx.projectClosureSnapshot.create({ data });
    if (costRows.length > 0) {
      await tx.projectClosureSnapshotCost.createMany({
        data: costRows.map((row) => ({
          tenantId: snapshot.tenantId,
          snapshotId: snapshot.id,
          costTypeId: row.costTypeId,
          amount: row.amount,
        })),
      });
    }
    return tx.projectClosureSnapshot.findFirstOrThrow({
      where: { id: snapshot.id },
      include: WITH_COSTS,
    });
  }

  /** The one live snapshot (`voided_at IS NULL`) of a project, if it is closed. */
  findLiveByProject(projectId: number): Promise<SnapshotWithCosts | null> {
    return this.tenantPrisma.db.projectClosureSnapshot.findFirst({
      where: { projectId, voidedAt: null },
      include: WITH_COSTS,
    });
  }

  /** Sets `voided_at` / `voided_by`. The row stays — it is never deleted. */
  async void(
    id: number,
    userId: number,
    tx: TenantTransactionClient,
  ): Promise<void> {
    await tx.projectClosureSnapshot.update({
      where: { id },
      data: { voidedAt: new Date(), voidedBy: userId },
    });
  }
}
