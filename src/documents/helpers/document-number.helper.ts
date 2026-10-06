import { DocumentType } from '@prisma/client';

/** `quote` -> `QUO`, `invoice` -> `INV`, `purchase_invoice` -> `PUR` (doc/notes/document-numbering.md). */
const DOCUMENT_PREFIXES: Record<DocumentType, string> = {
  quote: 'QUO',
  invoice: 'INV',
  purchase_invoice: 'PUR',
};

/**
 * `QUO-2026-0001` — 4 digits, zero-padded. `lastNumber` is the value
 * `document_counters.last_number` returned after the row-locked
 * `INSERT ... ON CONFLICT DO UPDATE` (see `document-counter.repository.ts`).
 */
export function formatDocumentNumber(
  documentType: DocumentType,
  year: number,
  lastNumber: number,
): string {
  const prefix = DOCUMENT_PREFIXES[documentType];
  const padded = String(lastNumber).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}
