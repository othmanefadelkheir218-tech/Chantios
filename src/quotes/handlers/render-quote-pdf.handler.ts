import { Injectable, NotFoundException } from '@nestjs/common';
import { Quote, QuoteLine } from '@prisma/client';
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
import { resolveLogoUrl } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

export type RenderQuotePdfResult =
  | { mode: 'buffer'; buffer: Buffer; filename: string }
  | { mode: 'redirect'; url: string; filename: string };

/**
 * `GET /api/quotes/:id/pdf` (doc/notes/Phaces/15-documents.md): this handler
 * lives in `quotes`, NOT `documents/handlers/` as the step file's folder
 * sketch shows, because `documents` cannot import `quotes`/`clients`/
 * `tenants`/`media` back (they already import `DocumentsModule` today — the
 * reverse import would be a real cycle). Same fix already used twice in this
 * codebase: `ProjectBudgetHistoryController` (lives in `quotes`, not
 * `margins`) and `ProjectLabourCostController` (lives in `time-entries`, not
 * `projects`).
 *
 * `draft` -> re-rendered live every time, nothing stored. `sent`+ -> the
 * CURRENT frozen file. A resent quote (`sent -> draft -> sent` again) can
 * have several `media` rows for the same quote — `findByEntityIds` orders
 * them oldest first, so the LAST element is the current one; the earlier
 * ones stay servable by their own `media.id` (the portal already does
 * this), just never the one this route redirects to. If a `sent`+ quote has
 * no frozen file at all (a pre-step-15 legacy row), falls back to a live
 * render and logs a warning rather than failing.
 */
@Injectable()
export class RenderQuotePdfHandler {
  constructor(
    @InjectPinoLogger(RenderQuotePdfHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
    private readonly tenants: TenantsService,
    private readonly clients: ClientsService,
    private readonly media: MediaService,
    private readonly documents: DocumentsService,
  ) {}

  async execute(
    id: number,
    actor: AuthenticatedUser,
  ): Promise<RenderQuotePdfResult> {
    this.logger.info(`Rendering PDF for quote ${id}`);

    const quote = await this.quotes.findById(id);
    if (!quote) {
      this.logger.warn(`Cannot render quote PDF: ${id} not found`);
      throw new NotFoundException('Quote not found');
    }
    const filename = `${quote.number}.pdf`;

    if (quote.status !== 'draft') {
      const byEntity = await this.media.findByEntityIds('quote', [id]);
      const files = byEntity.get(id) ?? [];
      const current = files[files.length - 1];
      if (current) {
        return { mode: 'redirect', url: current.fileUrl, filename };
      }
      this.logger.warn(
        `Quote ${id} is ${quote.status} with no frozen PDF — rendering live as a fallback`,
      );
    }

    const buffer = await this.renderLive(quote, actor);
    return { mode: 'buffer', buffer, filename };
  }

  private async renderLive(
    quote: Quote,
    actor: AuthenticatedUser,
  ): Promise<Buffer> {
    const lines: QuoteLine[] = await this.quotes.findLines(quote.id);
    const tenantRaw = await this.tenants.findForNotifications(actor.tenantId);
    if (!tenantRaw) {
      throw new NotFoundException('Tenant not found');
    }
    const client = await this.clients.findByIdRaw(quote.clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    const logoUrl = await resolveLogoUrl(this.media, tenantRaw.logoMediaId);
    return this.documents.renderQuotePdf(
      quote,
      lines,
      toLetterheadTenant(tenantRaw, logoUrl),
      toLetterheadClient(client),
    );
  }
}
