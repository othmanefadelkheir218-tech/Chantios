import { Module } from '@nestjs/common';
import { DocumentCounterRepository } from './repositories/document-counter.repository';
import { DocumentsService } from './documents.service';
import { PdfService } from './pdf/pdf.service';

/**
 * Shared, no controller (same shape as `src/audit/`). `quotes` and `invoices`
 * import this for `DocumentsService.allocateNumber` — the row-locked counter
 * and the per-rate VAT totals helper are written once here and reused by
 * both document types (and step 07's `purchase_invoices`) — and, since step
 * 15, for `renderQuotePdf`/`renderInvoicePdf`. `PdfService` (the pdfmake
 * wrapper) is internal: nothing outside this module calls it directly.
 */
@Module({
  providers: [DocumentsService, DocumentCounterRepository, PdfService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
