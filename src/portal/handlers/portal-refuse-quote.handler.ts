import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { QuotesService } from '../../quotes/quotes.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { VISIBLE_QUOTE_STATUSES } from '../helpers/portal.helper';

/**
 * `POST /api/portal/:token/quotes/:id/refuse` — calls `QuotesService.refuse`,
 * the same `RefuseQuoteHandler` staff use. Only a `sent` quote can be refused;
 * the project stays `prospect`. Same visibility rule as accept: another
 * project's quote, or one the client may not see, is a `404`.
 */
@Injectable()
export class PortalRefuseQuoteHandler {
  constructor(
    @InjectPinoLogger(PortalRefuseQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuotesService,
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
      `Client ${portal.clientId} refuses quote ${quoteId} from the portal`,
    );

    await this.quotes.refuse(quoteId, {
      userId: null,
      tenantId: portal.tenantId,
    });

    await this.audit.write({
      tenantId: portal.tenantId,
      action: 'portal_refuse',
      entityType: 'quote',
      entityId: quoteId,
      newValue: { clientId: portal.clientId, portalTokenId: portal.tokenId },
      ipAddress: portal.ip,
    });
    return { id: quoteId, status: 'refused' as const };
  }
}
