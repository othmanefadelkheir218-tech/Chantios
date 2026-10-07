import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceLine } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { DocumentsService } from '../../documents/documents.service';
import { toUploadableFile } from '../../documents/helpers/pdf-upload.helper';
import {
  toLetterheadClient,
  toLetterheadTenant,
} from '../../documents/pdf/layouts/letterhead.layout';
import { MediaService } from '../../media/media.service';
import { TenantsService } from '../../tenants/tenants.service';
import { resolveLogoUrl } from '../helpers/invoice.helper';

/**
 * Mirror of `freeze-quote-pdf.handler.ts`. Called from inside
 * `send-invoice.handler.ts` BEFORE the status flips to `sent` — a render or
 * upload failure leaves the invoice `draft`, untouched, no email sent.
 */
@Injectable()
export class FreezeInvoicePdfHandler {
  constructor(
    @InjectPinoLogger(FreezeInvoicePdfHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantsService,
    private readonly clients: ClientsService,
    private readonly media: MediaService,
    private readonly documents: DocumentsService,
  ) {}

  async execute(
    invoice: Invoice,
    lines: InvoiceLine[],
    actor: AuthenticatedUser,
  ): Promise<{
    media: Awaited<ReturnType<MediaService['upload']>>;
    buffer: Buffer;
  }> {
    this.logger.info(`Freezing PDF for invoice ${invoice.id}`);

    const tenantRaw = await this.tenants.findForNotifications(actor.tenantId);
    if (!tenantRaw) {
      throw new NotFoundException('Tenant not found');
    }
    const client = await this.clients.findByIdRaw(invoice.clientId);
    if (!client) {
      throw new BadRequestException('Cannot send an invoice with no client');
    }

    const logoUrl = await resolveLogoUrl(this.media, tenantRaw.logoMediaId);
    const buffer = await this.documents.renderInvoicePdf(
      invoice,
      lines,
      toLetterheadTenant(tenantRaw, logoUrl),
      toLetterheadClient(client),
    );

    const file = toUploadableFile(buffer, `${invoice.number}.pdf`);
    const mediaEntity = await this.media.upload(
      file,
      { entity_type: 'invoice', entity_id: invoice.id },
      actor,
      true, // is_locked
    );

    this.logger.info(
      `Invoice ${invoice.id} PDF frozen as media ${mediaEntity.id}`,
    );
    return { media: mediaEntity, buffer };
  }
}
