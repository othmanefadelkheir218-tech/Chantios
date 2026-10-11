import { Injectable } from '@nestjs/common';
import { ImportBatch } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { ActingParty } from '../../auth/decorators/current-user.decorator';
import { NotificationsService } from '../../notifications/notifications.service';
import { StockService } from '../../stock/stock.service';
import { ImportError, importErrors } from '../helpers/import-error.helper';
import { ImportBatchRepository } from '../repositories/import-batch.repository';
import { ImportRunResult } from './run-import.types';
import { RunMaterialsImportHandler } from './run-materials-import.handler';
import { RunStockImportHandler } from './run-stock-import.handler';

/**
 * The job's whole life (doc/notes/bulk-import.md § Import batches):
 * `pending → processing → done | failed`, then one audit row and one
 * `import_done` / `import_failed` notification for the user who sent the
 * file. A crash is a `failed` batch with one general error — the user is
 * told either way.
 */
@Injectable()
export class RunImportHandler {
  constructor(
    @InjectPinoLogger(RunImportHandler.name)
    private readonly logger: PinoLogger,
    private readonly batches: ImportBatchRepository,
    private readonly runMaterials: RunMaterialsImportHandler,
    private readonly runStock: RunStockImportHandler,
    private readonly stock: StockService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(batchId: number, actor: ActingParty): Promise<void> {
    const batch = await this.batches.findById(batchId);
    if (!batch || batch.status !== 'pending') {
      this.logger.warn(
        `Import batch ${batchId} skipped: ${batch ? batch.status : 'not found'}`,
      );
      return;
    }
    this.logger.info(`Import batch ${batchId} (${batch.type}) started`);
    await this.batches.update(batchId, {
      status: 'processing',
      startedAt: new Date(),
    });

    let result: ImportRunResult;
    try {
      result =
        batch.type === 'materials'
          ? await this.runMaterials.execute(batch, actor)
          : await this.runStock.execute(batch, actor);
    } catch (err: unknown) {
      this.logger.error({ err }, `Import batch ${batchId} crashed`);
      result = { status: 'failed', errors: [importErrors.unexpected()] };
    }

    if (result.status === 'failed') {
      await this.batches.update(batchId, {
        status: 'failed',
        finishedAt: new Date(),
        errors: result.errors as unknown as object[],
      });
    } else {
      // After the commit: the same soft stock alerts as a single movement.
      for (const materialId of result.touchedMaterialIds) {
        await this.stock.checkMaterialCoverage(materialId, actor.tenantId);
      }
    }

    await this.report(batch, result, actor);
  }

  private async report(
    batch: ImportBatch,
    result: ImportRunResult,
    actor: ActingParty,
  ): Promise<void> {
    const errors: ImportError[] =
      result.status === 'failed' ? result.errors : [];
    const counts = {
      row_count: batch.rowCount,
      created_count: result.status === 'done' ? result.createdCount : 0,
      updated_count: result.status === 'done' ? result.updatedCount : 0,
      error_count: errors.length,
    };
    this.logger.info(
      `Import batch ${batch.id} ${result.status}: ${JSON.stringify(counts)}`,
    );

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: result.status === 'done' ? 'import' : 'import_failed',
      entityType: 'import_batch',
      entityId: batch.id,
      newValue: { type: batch.type, file_name: batch.fileName, ...counts },
      ipAddress: null,
    });

    if (actor.userId === null) return;
    await this.notifications.dispatch(
      result.status === 'done' ? 'import_done' : 'import_failed',
      {
        tenantId: actor.tenantId,
        userIds: [actor.userId],
        payload: {
          entity_id: batch.id,
          import_batch_id: batch.id,
          import_type: batch.type,
          file_name: batch.fileName,
          ...counts,
        },
      },
    );
  }
}
