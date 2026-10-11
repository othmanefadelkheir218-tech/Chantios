import { createHash } from 'crypto';

/** Same keys in the same order, whatever order the JSON body used. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [
          key,
          canonical((value as Record<string, unknown>)[key]),
        ]),
    );
  }
  return value;
}

/**
 * sha256 of the rows — what blocks a double import (doc/notes/bulk-import.md
 * § Import batches). The same file sent twice gives the same hash.
 */
export function hashImportRows(rows: unknown[]): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(rows)))
    .digest('hex');
}
