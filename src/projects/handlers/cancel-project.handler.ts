import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { MarginsService } from '../../margins/margins.service';
import { StockService } from '../../stock/stock.service';
import { toProjectEntity } from '../helpers/project.helper';
import { ProjectStatusHistoryRepository } from '../repositories/project-status-history.repository';
import { ProjectRepository } from '../repositories/project.repository';

/**
 * Cancellation-specific side effects (doc/notes/technical/phase-03-clients-projects.md
 * § "Project cancellation rule"). Called by `change-status.handler` once the
 * matrix has already accepted the `-> cancelled` move — this handler owns
 * only what is specific to cancelling, not the generic status-change plumbing.
 *
 * Step 10 (margin): a cancelled job still cost the company money, so
 * cancelling freezes the project's numbers into a closure snapshot, in the
 * SAME transaction as the status change and its history row. `cancelled` is
 * final (no reopen), so this snapshot is never voided.
 */
@Injectable()
export class CancelProjectHandler {
  constructor(
    @InjectPinoLogger(CancelProjectHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly history: ProjectStatusHistoryRepository,
    private readonly stock: StockService,
    private readonly audit: AuditService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly margins: MarginsService,
  ) {}

  async execute(
    project: Project,
    reason: string | undefined,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Cancelling project ${project.id}`);

    const { updated, snapshotId } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const updated = await this.projects.setStatus(
          project.id,
          'cancelled',
          undefined,
          tx,
        );
        await this.history.write(
          {
            tenantId: actor.tenantId,
            projectId: project.id,
            fromStatus: project.status,
            toStatus: 'cancelled',
            reason: reason ?? null,
            changedBy: actor.userId,
          },
          tx,
        );
        const snapshot = await this.margins.writeClosureSnapshot(
          project.id,
          actor,
          tx,
        );
        return { updated, snapshotId: snapshot.id };
      },
    );

    // Release this project's unused stock_reservations back to the shared
    // pool — through StockService, never its repository. Already-consumed
    // movements are untouched (doc/notes/qa-project-quote-stock-invoices.md
    // § "When a project is cancelled").
    await this.stock.releaseByProject(project.id, actor);

    // TODO: step 13 — fire the "don't forget to invoice the client for
    // completed work" alert here, once the alerts module exists.

    const entity = toProjectEntity(updated);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'cancel',
      entityType: 'project',
      entityId: project.id,
      oldValue: { status: project.status },
      newValue: { status: 'cancelled', snapshotId },
      ipAddress: null,
    });
    this.logger.info(`Project cancelled: ${project.id}`);
    return entity;
  }
}
