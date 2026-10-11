import { Prisma } from '@prisma/client';

/**
 * True when a write hit a unique rule. Prisma reports it as `P2002` for the
 * indexes it knows. An index written by hand in a migration (a partial or an
 * expression index) can come back as a raw Postgres error instead — SQLSTATE
 * `23505`, under `meta` (same place `PrismaExceptionFilter` reads it).
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === 'P2002') return true;
  const meta = error.meta as
    | {
        driverAdapterError?: {
          cause?: { code?: string; originalCode?: string };
        };
      }
    | undefined;
  const cause = meta?.driverAdapterError?.cause;
  return cause?.code === '23505' || cause?.originalCode === '23505';
}
