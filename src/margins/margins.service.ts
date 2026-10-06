import { Injectable } from '@nestjs/common';
import {
  ActingParty,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../common/prisma/tenant-prisma.service';
import { FindMarginsQueryDto } from './dto/find-margins-query.dto';
import { CheckThresholdsHandler } from './handlers/check-thresholds.handler';
import { FindMarginsHandler } from './handlers/find-margins.handler';
import { FindProjectMarginHandler } from './handlers/find-project-margin.handler';
import { FindSnapshotHandler } from './handlers/find-snapshot.handler';
import { MarginBreakdownHandler } from './handlers/margin-breakdown.handler';
import { VoidSnapshotHandler } from './handlers/void-snapshot.handler';
import { WriteSnapshotHandler } from './handlers/write-snapshot.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class MarginsService {
  constructor(
    private readonly findMargins: FindMarginsHandler,
    private readonly findProjectMargin: FindProjectMarginHandler,
    private readonly marginBreakdown: MarginBreakdownHandler,
    private readonly findSnapshot: FindSnapshotHandler,
    private readonly writeSnapshot: WriteSnapshotHandler,
    private readonly voidSnapshot: VoidSnapshotHandler,
    private readonly checkThresholds: CheckThresholdsHandler,
  ) {}

  findAll(query: FindMarginsQueryDto) {
    return this.findMargins.execute(query);
  }

  findOne(projectId: number) {
    return this.findProjectMargin.execute(projectId);
  }

  breakdown(projectId: number) {
    return this.marginBreakdown.execute(projectId);
  }

  snapshot(projectId: number) {
    return this.findSnapshot.execute(projectId);
  }

  // ---- Internal API for `projects` (closure), and for the cost writers (alerts) ----

  /** Step 04's status change: freeze the numbers on `completed` / `cancelled`, inside its transaction. */
  writeClosureSnapshot(
    projectId: number,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ) {
    return this.writeSnapshot.execute(projectId, actor, tx);
  }

  /** Step 04's admin reopen: void the live snapshot (never delete), inside its transaction. */
  voidClosureSnapshot(
    projectId: number,
    actor: AuthenticatedUser,
    tx: TenantTransactionClient,
  ) {
    return this.voidSnapshot.execute(projectId, actor, tx);
  }

  /**
   * Called AFTER a time entry, consumption, purchase invoice or accepted quote
   * is saved. Fires each alert level once, and resets a level when the cost
   * falls back under it. Never throws — the triggering save is already done.
   */
  checkProjectThresholds(projectId: number | null, actor: ActingParty) {
    if (projectId === null) return Promise.resolve();
    return this.checkThresholds.execute(projectId, actor.tenantId);
  }
}
