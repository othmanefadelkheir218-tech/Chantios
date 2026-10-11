export const IMPORTS_QUEUE = 'imports';

/** The rows of one import file (doc/notes/bulk-import.md § Format). */
export const MAX_IMPORT_ROWS = 500;

/** One BullMQ job: run one import batch, for the user who sent it. */
export interface ImportJobData {
  batchId: number;
  tenantId: number;
  userId: number;
}
