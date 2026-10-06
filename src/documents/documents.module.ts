import { Module } from '@nestjs/common';
import { DocumentCounterRepository } from './repositories/document-counter.repository';
import { DocumentsService } from './documents.service';

/**
 * Shared, no controller (same shape as `src/audit/`). `quotes` and `invoices`
 * import this for `DocumentsService.allocateNumber` — the row-locked counter
 * and the per-rate VAT totals helper are written once here and reused by
 * both document types (and step 07's `purchase_invoices`).
 */
@Module({
  providers: [DocumentsService, DocumentCounterRepository],
  exports: [DocumentsService],
})
export class DocumentsModule {}
