import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InvoicesService } from '../../invoices/invoices.service';
import { MediaService } from '../../media/media.service';
import { QuotesService } from '../../quotes/quotes.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import {
  VISIBLE_INVOICE_STATUSES,
  VISIBLE_QUOTE_STATUSES,
} from '../helpers/portal.helper';
import { TrackEventHandler } from './track-event.handler';

/**
 * `GET /api/portal/:token/documents/:mediaId` — the frozen PDF of a quote or an
 * invoice the client may see. The file is served ONLY if its owner is a quote
 * or invoice of THIS token's project that is itself visible to the client
 * (never a draft, a refused quote, a cancelled invoice) — a media id from
 * another project, another entity type or another tenant is a plain `404`.
 * Writes a `download` tracking row; returns the file URL for the controller
 * to redirect to.
 */
@Injectable()
export class PortalDocumentHandler {
  constructor(
    @InjectPinoLogger(PortalDocumentHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaService,
    private readonly quotes: QuotesService,
    private readonly invoices: InvoicesService,
    private readonly track: TrackEventHandler,
  ) {}

  async execute(portal: PortalContextData, mediaId: number): Promise<string> {
    // Tenant-scoped (the token guard set the tenant) and never a trashed file.
    const file = await this.media.findOne(mediaId).catch(() => null);

    let allowed = false;
    if (file?.entityType === 'quote') {
      const quote = await this.quotes.findByIdRaw(file.entityId);
      allowed =
        !!quote &&
        quote.projectId === portal.projectId &&
        VISIBLE_QUOTE_STATUSES.includes(quote.status);
    } else if (file?.entityType === 'invoice') {
      const invoice = await this.invoices.findByIdRaw(file.entityId);
      allowed =
        !!invoice &&
        invoice.projectId === portal.projectId &&
        VISIBLE_INVOICE_STATUSES.includes(invoice.status);
    }

    if (!file || !allowed) {
      this.logger.warn(
        `Portal link ${portal.tokenId}: document ${mediaId} is not available on project ${portal.projectId}`,
      );
      throw new NotFoundException('Document not found');
    }

    await this.track.execute(portal, 'download');
    return file.fileUrl;
  }
}
