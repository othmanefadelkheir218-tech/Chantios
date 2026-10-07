import { Injectable } from '@nestjs/common';
import {
  DocumentType,
  Invoice,
  InvoiceLine,
  Quote,
  QuoteLine,
} from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TenantTransactionClient } from '../common/prisma/tenant-prisma.service';
import { formatDocumentNumber } from './helpers/document-number.helper';
import { DocumentCounterRepository } from './repositories/document-counter.repository';
import {
  fetchLogoDataUri,
  LetterheadClient,
  LetterheadTenant,
} from './pdf/layouts/letterhead.layout';
import { buildInvoiceDocDefinition } from './pdf/renderers/invoice.renderer';
import { buildQuoteDocDefinition } from './pdf/renderers/quote.renderer';
import { PdfService } from './pdf/pdf.service';

/**
 * The shared door `quotes` and `invoices` (and step 07's `purchase_invoices`)
 * call to get their next number — one lock, one format, one implementation
 * (doc/notes/Phaces/06-quotes-invoices.md). `tx` is required: this must run
 * inside the document's own creation transaction or the row lock is pointless.
 *
 * `renderQuotePdf`/`renderInvoicePdf` (step 15) are the other half: pure
 * functions of their arguments plus pdfmake/image-fetching side effects —
 * `tenant`/`client` are already-resolved plain data
 * (`LetterheadTenant`/`LetterheadClient`), never a `TenantsService`/
 * `ClientsService` call. This keeps `DocumentsService` a leaf: it must never
 * import `quotes`, `invoices`, `media`, `clients` or `tenants`.
 */
@Injectable()
export class DocumentsService {
  constructor(
    @InjectPinoLogger(DocumentsService.name)
    private readonly logger: PinoLogger,
    private readonly counters: DocumentCounterRepository,
    private readonly pdf: PdfService,
  ) {}

  async allocateNumber(
    documentType: DocumentType,
    tx: TenantTransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const lastNumber = await this.counters.nextNumber(documentType, year, tx);
    return formatDocumentNumber(documentType, year, lastNumber);
  }

  /**
   * Renders a quote to PDF. Totals (`amount_excl_vat`/`vat_amount`/
   * `amount_incl_vat`) are read from the `quote` row exactly as stored — no
   * arithmetic happens here (doc/notes/Phaces/15-documents.md, repeated
   * three times in the step file for a reason).
   */
  async renderQuotePdf(
    quote: Quote,
    lines: QuoteLine[],
    tenant: LetterheadTenant,
    client: LetterheadClient,
  ): Promise<Buffer> {
    this.logger.info(`Rendering quote PDF ${quote.id} (${quote.number})`);
    const logoDataUri = await fetchLogoDataUri(tenant.logoUrl, this.logger);
    const docDefinition = buildQuoteDocDefinition(
      quote,
      lines,
      tenant,
      client,
      logoDataUri,
    );
    return this.pdf.render(docDefinition);
  }

  /** Same rule as `renderQuotePdf`, plus the payment block (`due_date` + `note`). */
  async renderInvoicePdf(
    invoice: Invoice,
    lines: InvoiceLine[],
    tenant: LetterheadTenant,
    client: LetterheadClient,
  ): Promise<Buffer> {
    this.logger.info(`Rendering invoice PDF ${invoice.id} (${invoice.number})`);
    const logoDataUri = await fetchLogoDataUri(tenant.logoUrl, this.logger);
    const docDefinition = buildInvoiceDocDefinition(
      invoice,
      lines,
      tenant,
      client,
      logoDataUri,
    );
    return this.pdf.render(docDefinition);
  }
}
