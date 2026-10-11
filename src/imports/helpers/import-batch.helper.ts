import { ImportBatch } from '@prisma/client';
import { ImportError } from './import-error.helper';

/** What may leave the module. `rows` never does — it is the job's input only. */
export function toImportBatchEntity(batch: ImportBatch, withErrors = false) {
  const errors = (batch.errors as ImportError[] | null) ?? [];
  return {
    id: batch.id,
    type: batch.type,
    status: batch.status,
    fileName: batch.fileName,
    rowCount: batch.rowCount,
    createdCount: batch.createdCount,
    updatedCount: batch.updatedCount,
    errorCount: errors.length,
    ...(withErrors && { errors }),
    createdBy: batch.createdBy,
    createdAt: batch.createdAt,
    startedAt: batch.startedAt,
    finishedAt: batch.finishedAt,
  };
}
