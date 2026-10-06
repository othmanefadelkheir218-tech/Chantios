import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toQuoteEntity } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

/**
 * `POST /api/quotes/:id/refuse` — `sent -> refused`, `refused_at` set.
 * The project stays `prospect` — nothing else to do (doc/notes/Phaces/06-quotes-invoices.md).
 * Both the staff route (here) and the step 12 client-portal route call this
 * same handler, so `refused_at` is always real.
 */
@Injectable()
export class RefuseQuoteHandler {
  constructor(
    @InjectPinoLogger(RefuseQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Refusing quote ${id}`);

    const quote = await this.quotes.findById(id);
    if (!quote) {
      this.logger.warn(`Cannot refuse quote: ${id} not found`);
      throw new NotFoundException('Quote not found');
    }
    if (quote.status !== 'sent') {
      throw new BadRequestException(
        `Cannot refuse a quote from status ${quote.status}`,
      );
    }

    const updated = await this.quotes.setStatus(id, 'refused', {
      refusedAt: new Date(),
    });
    const entity = toQuoteEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'refuse',
      entityType: 'quote',
      entityId: id,
      oldValue: { status: quote.status },
      newValue: { status: 'refused' },
      ipAddress: null,
    });
    this.logger.info(`Quote refused: ${id}`);
    return entity;
  }
}
