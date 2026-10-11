import { ImportError } from '../helpers/import-error.helper';

/** What a run handler hands back to `run-import.handler`. */
export type ImportRunResult =
  | {
      status: 'done';
      createdCount: number;
      updatedCount: number;
      /** Materials whose stock moved — the coverage check runs once for each, after commit. */
      touchedMaterialIds: number[];
    }
  | { status: 'failed'; errors: ImportError[] };

/** Up to 500 materials + 500 movements: more than Prisma's 5 s default. */
export const IMPORT_TRANSACTION = { maxWait: 10_000, timeout: 60_000 };
