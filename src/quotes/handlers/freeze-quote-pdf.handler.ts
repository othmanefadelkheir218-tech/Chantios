import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Quote, QuoteLine } from '@prisma/client';
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
import { resolveLogoUrl } from '../helpers/quote.helper';

/**
 * Called from inside `send-quote.handler.ts`, BEFORE the status flips to
 * `sent` (doc/notes/Phaces/15-documents.md "Wiring into send-quote / send-invoice":
 * render + upload happen while the quote is still `draft`, so a failure here
 * leaves the quote untouched — no half-sent state, no email, no status
 * change). Lives in `quotes`, not `documents/handlers/`, for the same
 * module-boundary reason as `render-quote-pdf.handler.ts`.
 *
 * Returns the raw `Buffer` alongside the `media` row — `send-quote.handler`
 * attaches THIS buffer to the client email; it never re-fetches the file
 * from the CDN it was just uploaded to.
 */
@Injectable()
export class FreezeQuotePdfHandler {
  constructor(
    @InjectPinoLogger(FreezeQuotePdfHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantsService,
    private readonly clients: ClientsService,
    private readonly media: MediaService,
    private readonly documents: DocumentsService,
  ) {}

  async execute(
    quote: Quote,
    lines: QuoteLine[],
    actor: AuthenticatedUser,
  ): Promise<{
    media: Awaited<ReturnType<MediaService['upload']>>;
    buffer: Buffer;
  }> {
    this.logger.info(`Freezing PDF for quote ${quote.id}`);

    const tenantRaw = await this.tenants.findForNotifications(actor.tenantId);
    if (!tenantRaw) {
      throw new NotFoundException('Tenant not found');
    }
    const client = await this.clients.findByIdRaw(quote.clientId);
    if (!client) {
      throw new BadRequestException('Cannot send a quote with no client');
    }

    const logoUrl = await resolveLogoUrl(this.media, tenantRaw.logoMediaId);
    const buffer = await this.documents.renderQuotePdf(
      quote,
      lines,
      toLetterheadTenant(tenantRaw, logoUrl),
      toLetterheadClient(client),
    );

    const file = toUploadableFile(buffer, `${quote.number}.pdf`);
    const mediaEntity = await this.media.upload(
      file,
      { entity_type: 'quote', entity_id: quote.id },
      actor,
      true, // is_locked
    );

    this.logger.info(`Quote ${quote.id} PDF frozen as media ${mediaEntity.id}`);
    return { media: mediaEntity, buffer };
  }
}
