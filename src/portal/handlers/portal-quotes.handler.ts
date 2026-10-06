import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaService } from '../../media/media.service';
import { QuotesService } from '../../quotes/quotes.service';
import { PortalContextData } from '../decorators/portal-context.decorator';
import { VISIBLE_QUOTE_STATUSES } from '../helpers/portal.helper';
import { toPortalQuote } from '../helpers/portal-view.helper';

/**
 * `GET /api/portal/:token/quotes` — the project's `sent` and `accepted`
 * quotes only: never `draft`, never `refused`. Each carries its lines and its
 * frozen PDF(s), through the allow-list.
 */
@Injectable()
export class PortalQuotesHandler {
  constructor(
    @InjectPinoLogger(PortalQuotesHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuotesService,
    private readonly media: MediaService,
  ) {}

  async execute(portal: PortalContextData) {
    this.logger.debug(`Portal quotes of project ${portal.projectId}`);
    const quotes = await this.quotes.findByProjectAndStatuses(
      portal.projectId,
      VISIBLE_QUOTE_STATUSES,
    );
    const documents = await this.media.findByEntityIds(
      'quote',
      quotes.map((quote) => quote.id),
    );
    return {
      data: quotes.map((quote) =>
        toPortalQuote(quote, documents.get(quote.id)),
      ),
    };
  }
}
