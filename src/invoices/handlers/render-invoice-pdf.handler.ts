import { Injectable, NotFoundException } from '@nestjs/common';
import { Invoice, InvoiceLine } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { DocumentsService } from '../../documents/documents.service';
import {
  toLetterheadClient,
  toLetterheadTenant,
} from '../../documents/pdf/layouts/letterhead.layout';
import { MediaService } from '../../media/media.service';
import { TenantsService } from '../../tenants/tenants.service';
import { resolveLogoUrl } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

export type RenderInvoicePdfResult =
  | { mode: 'buffer'; buffer: Buffer; filename: string }
  | { mode: 'redirect'; url: string; filename: string };

/**
 * `GET /api/invoices/:id/pdf` — mirror of `render-quote-pdf.handler.ts`,
 * same module-boundary reason (lives in `invoices`, not `documents/handlers/`,
 * because `invoices` already imports `DocumentsModule`/`MediaModule` and the
 * reverse import would cycle). `draft` -> live render, nothing stored.
 * `sent`+ -> the CURRENT frozen file (last element of `findByEntityIds`,
 * oldest-first — a resent... invoices don't resend after `sent` the way
 * quotes do, but the lookup is identical and just as safe either way).
 * Falls back to a live render + warning if a `sent`+ invoice has no frozen
 * file (a pre-step-15 legacy row).
 */
@Injectable()
export class RenderInvoicePdfHandler {
  constructor(
    @InjectPinoLogger(RenderInvoicePdfHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly tenants: TenantsService,
    private readonly clients: ClientsService,
    private readonly media: MediaService,
    private readonly documents: DocumentsService,
  ) {}

  async execute(
    id: number,
    actor: AuthenticatedUser,
  ): Promise<RenderInvoicePdfResult> {
    this.logger.info(`Rendering PDF for invoice ${id}`);

    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      this.logger.warn(`Cannot render invoice PDF: ${id} not found`);
      throw new NotFoundException('Invoice not found');
    }
    const filename = `${invoice.number}.pdf`;

    if (invoice.status !== 'draft') {
      const byEntity = await this.media.findByEntityIds('invoice', [id]);
      const files = byEntity.get(id) ?? [];
      const current = files[files.length - 1];
      if (current) {
        return { mode: 'redirect', url: current.fileUrl, filename };
      }
      this.logger.warn(
        `Invoice ${id} is ${invoice.status} with no frozen PDF — rendering live as a fallback`,
      );
    }

    const buffer = await this.renderLive(invoice, actor);
    return { mode: 'buffer', buffer, filename };
  }

  private async renderLive(
    invoice: Invoice,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    const lines: InvoiceLine[] = await this.invoices.findLines(invoice.id);
    const tenantRaw = await this.tenants.findForNotifications(actor.tenantId);
    if (!tenantRaw) {
      throw new NotFoundException('Tenant not found');
    }
    const client = await this.clients.findByIdRaw(invoice.clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    const logoUrl = await resolveLogoUrl(this.media, tenantRaw.logoMediaId);
    return this.documents.renderInvoicePdf(
      invoice,
      lines,
      toLetterheadTenant(tenantRaw, logoUrl),
      toLetterheadClient(client),
    );
  }
}
