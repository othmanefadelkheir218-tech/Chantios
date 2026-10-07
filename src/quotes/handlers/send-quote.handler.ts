import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from '../../clients/clients.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { toQuoteEntity } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

/**
 * `POST /api/quotes/:id/send` — `draft -> sent`, `sent_at` set. Lines and
 * totals are locked from here (doc/notes/Phaces/06-quotes-invoices.md).
 * Refuses (400) a quote with zero lines, then emails the client. Attaching
 * the frozen PDF to that email is step 15's job.
 */
@Injectable()
export class SendQuoteHandler {
  constructor(
    @InjectPinoLogger(SendQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
    private readonly audit: AuditService,
    private readonly clients: ClientsService,
    private readonly notifications: NotificationsService,
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

    // The "please review" email. Attaching the frozen PDF is step 15's job.
    const client = await this.clients.findByIdRaw(quote.clientId);
    if (client) {
      await this.notifications.dispatch('client_quote_sent', {
        tenantId: actor.tenantId,
        clientEmail: client.email,
        payload: { quote_ref: quote.number },
      });
    }

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
