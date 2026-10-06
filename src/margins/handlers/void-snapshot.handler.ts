import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { ClosureSnapshotRepository } from '../repositories/closure-snapshot.repository';

/**
 * On an admin reopen (`completed → in_progress`): sets `voided_at` and
 * `voided_by` on the project's live snapshot. **Never deletes** — a snapshot is
 * a financial record, so the row stays; the next close writes a fresh one and
 * the partial unique index keeps exactly one live row per project. Called by
 * `projects` inside the status-change transaction (`tx`).
 */
@Injectable()
export class VoidSnapshotHandler {
  constructor(
    @InjectPinoLogger(VoidSnapshotHandler.name)
    private readonly logger: PinoLogger,
    private readonly snapshots: ClosureSnapshotRepository,
  ) {}

  /** Returns the voided snapshot's id, or `null` if the project had no live one. */
  async execute(
    projectId: number,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ): Promise<number | null> {
    const live = await this.snapshots.findLiveByProject(projectId);
    if (!live) {
      this.logger.warn(
        `Reopen of project ${projectId}: no live snapshot to void`,
      );
      return null;
    }
    await this.snapshots.void(live.id, actor.userId, tx);
    this.logger.info(
      `Snapshot ${live.id} of project ${projectId} voided by user ${actor.userId}`,
    );
    return live.id;
  }
}
