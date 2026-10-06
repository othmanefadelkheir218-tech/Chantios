import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { MediaService } from '../../media/media.service';
import { QuotesService } from '../../quotes/quotes.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { VISIBLE_QUOTE_STATUSES } from '../helpers/portal.helper';
import { toPortalQuote } from '../helpers/portal-view.helper';

/**
 * `POST /api/portal/:token/quotes/:id/accept` — the client's only write.
 *
 * ONE code path, two doors: this calls `QuotesService.accept`, which is the
 * very `AcceptQuoteHandler` a staff member hits. So the project moves to
 * `in_progress`, the reservations are created from the recipes, and
 * `accepted_at` is real — and the chain can never be skipped. There is no
 * second acceptance implementation here.
 *
 * The client has no user account, so it acts as `{ userId: null, tenantId }`
 * (`ActingParty`): `project_status_history.changed_by` stays NULL. A quote that
 * is not THIS token's project's, or that the client may not see (a `draft`, a
 * `refused` one), is a plain `404` — nothing confirms it exists.
 */
@Injectable()
export class PortalAcceptQuoteHandler {
  constructor(
    @InjectPinoLogger(PortalAcceptQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuotesService,
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  async execute(portal: PortalContextData, quoteId: number) {
    const quote = await this.quotes.findByIdRaw(quoteId);
    if (
      !quote ||
      quote.projectId !== portal.projectId ||
      !VISIBLE_QUOTE_STATUSES.includes(quote.status)
    ) {
      this.logger.warn(
        `Portal link ${portal.tokenId}: quote ${quoteId} is not visible on project ${portal.projectId}`,
      );
      throw new NotFoundException('Quote not found');
    }
    this.logger.info(
      `Client ${portal.clientId} accepts quote ${quoteId} from the portal`,
    );

    // The SAME handler a staff member calls: only a `sent` quote can be accepted.
    await this.quotes.accept(quoteId, {
      userId: null,
      tenantId: portal.tenantId,
    });

    await this.audit.write({
      tenantId: portal.tenantId,
      action: 'portal_accept',
      entityType: 'quote',
      entityId: quoteId,
      newValue: { clientId: portal.clientId, portalTokenId: portal.tokenId },
      ipAddress: portal.ip,
    });

    const [fresh] = (
      await this.quotes.findByProjectAndStatuses(
        portal.projectId,
        VISIBLE_QUOTE_STATUSES,
      )
    ).filter((candidate) => candidate.id === quoteId);
    const documents = await this.media.findByEntityIds('quote', [quoteId]);
    return toPortalQuote(fresh, documents.get(quoteId));
  }
}
