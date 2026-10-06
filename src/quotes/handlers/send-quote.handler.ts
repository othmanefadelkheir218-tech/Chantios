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
 * `POST /api/quotes/:id/send` — `draft -> sent`, `sent_at` set. Lines and
 * totals are locked from here (doc/notes/Phaces/06-quotes-invoices.md).
 * Refuses (400) a quote with zero lines. Emailing the client with the
 * frozen PDF attached is step 15's job — out of scope here, see the
 * `// TODO` below.
 */
@Injectable()
export class SendQuoteHandler {
  constructor(
    @InjectPinoLogger(SendQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Sending quote ${id}`);

    const quote = await this.quotes.findById(id);
    if (!quote) {
      this.logger.warn(`Cannot send quote: ${id} not found`);
      throw new NotFoundException('Quote not found');
    }
    if (quote.status !== 'draft') {
      throw new BadRequestException(
        `Cannot send a quote from status ${quote.status}`,
      );
    }
    const lines = await this.quotes.findLines(id);
    if (lines.length === 0) {
      this.logger.warn(`Cannot send quote ${id}: no lines`);
      throw new BadRequestException('Cannot send a quote with no lines');
    }

    const updated = await this.quotes.setStatus(id, 'sent', {
      sentAt: new Date(),
    });

    // TODO: step 15 — email the client with the frozen PDF attached.

    const entity = toQuoteEntity(updated, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'send',
      entityType: 'quote',
      entityId: id,
      oldValue: { status: quote.status },
      newValue: { status: 'sent' },
      ipAddress: null,
    });
    this.logger.info(`Quote sent: ${id}`);
    return entity;
  }
}
