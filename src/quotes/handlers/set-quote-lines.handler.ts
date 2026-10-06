import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { computeDocumentTotals } from '../../documents/helpers/document-totals.helper';
import { SetQuoteLinesDto } from '../dto/set-quote-lines.dto';
import {
  assertNonZeroQuantity,
  toQuoteEntity,
  toVatLine,
} from '../helpers/quote.helper';
import {
  QuoteLineCreateInput,
  QuoteRepository,
} from '../repositories/quote.repository';

/**
 * `PUT /api/quotes/:id/lines` — `draft` only. Replaces every line and
 * recomputes the 3 totals in the same transaction (doc/notes/Phaces/06-quotes-invoices.md).
 */
@Injectable()
export class SetQuoteLinesHandler {
  constructor(
    @InjectPinoLogger(SetQuoteLinesHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly quotes: QuoteRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    quoteId: number,
    dto: SetQuoteLinesDto,
    actor: AuthenticatedUser,
  ) {
    this.logger.info(
      `Replacing lines for quote ${quoteId} (${dto.lines.length} line(s))`,
    );

    const quote = await this.quotes.findById(quoteId);
    if (!quote) {
      this.logger.warn(`Cannot set lines: quote ${quoteId} not found`);
      throw new NotFoundException('Quote not found');
    }
    if (quote.status !== 'draft') {
      this.logger.warn(
        `Cannot set lines for quote ${quoteId}: status is ${quote.status}, not draft`,
      );
      throw new BadRequestException(
        'Lines are frozen once the quote has been sent',
      );
    }
    for (const line of dto.lines) {
      assertNonZeroQuantity(line.quantity);
    }

    const { updated, lines } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const lineInputs: QuoteLineCreateInput[] = dto.lines.map((line) => ({
          tenantId: actor.tenantId,
          serviceId: line.service_id ?? null,
          description: line.description,
          unit: line.unit ?? null,
          quantity: line.quantity,
          unitPriceExclVat: line.unit_price_excl_vat,
          vatRate: line.vat_rate,
          position: line.position,
        }));

        await this.quotes.replaceLines(quoteId, lineInputs, tx);
        const insertedLines = await this.quotes.findLines(quoteId, tx);
        const totals = computeDocumentTotals(insertedLines.map(toVatLine));
        const updated = await this.quotes.setTotals(quoteId, totals, tx);

        return { updated, lines: insertedLines };
      },
    );

    const entity = toQuoteEntity(updated, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'set_lines',
      entityType: 'quote',
      entityId: quoteId,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(
      `Lines replaced for quote ${quoteId}: ${lines.length} row(s)`,
    );
    return entity;
  }
}
