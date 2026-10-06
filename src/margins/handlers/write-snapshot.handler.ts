import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { toSnapshotEntity } from '../helpers/margin.helper';
import { ClosureSnapshotRepository } from '../repositories/closure-snapshot.repository';
import { MarginRepository } from '../repositories/margin.repository';

/**
 * The closure snapshot — written ONCE when a project becomes `completed` or
 * `cancelled`, called by `projects` inside the status-change transaction
 * (`tx`): the snapshot is written with the status change, or not at all.
 *
 * It reads the live view and the cost breakdown, then writes
 * `project_closure_snapshots` + one `project_closure_snapshot_costs` row per
 * cost type. Never updated afterwards — a financial record. A bill that
 * arrives later changes the live view only.
 *
 * Idempotent: if a live snapshot already exists (it could only be so if the
 * void on reopen was skipped) it is returned instead of a second one, which
 * the partial unique index would refuse anyway.
 *
 * No audit row here — the caller's own `change_status` audit entry carries the
 * snapshot id, written after the transaction commits.
 */
@Injectable()
export class WriteSnapshotHandler {
  constructor(
    @InjectPinoLogger(WriteSnapshotHandler.name)
    private readonly logger: PinoLogger,
    private readonly margins: MarginRepository,
    private readonly snapshots: ClosureSnapshotRepository,
  ) {}

  async execute(
    projectId: number,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ) {
    this.logger.info(`Writing the closure snapshot of project ${projectId}`);

    const existing = await this.snapshots.findLiveByProject(projectId);
    if (existing) {
      this.logger.warn(
        `Project ${projectId} already has a live snapshot (${existing.id}) — not writing a second`,
      );
      return toSnapshotEntity(existing);
    }

    const margin = await this.margins.findByProject(projectId);
    if (!margin) {
      throw new NotFoundException('Project not found');
    }
    const breakdown = await this.margins.findBreakdownByProject(projectId);

    const created = await this.snapshots.create(
      {
        tenantId: actor.tenantId,
        projectId,
        budgetExclVat: margin.budgetExclVat,
        totalCost: margin.totalCost,
        marginExclVat: margin.marginExclVat,
        marginPct: margin.marginPct,
        closedBy: actor.userId,
      },
      breakdown.map((row) => ({
        costTypeId: row.costTypeId,
        amount: row.amount,
      })),
      tx,
    );
    this.logger.info(
      `Snapshot ${created.id} written for project ${projectId}: ${created.costs.length} cost row(s), margin ${created.marginExclVat.toString()}`,
    );
    return toSnapshotEntity(created);
  }
}
