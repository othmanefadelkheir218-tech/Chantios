import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { toQuoteEntity } from '../helpers/quote.helper';
import { QuoteRepository } from '../repositories/quote.repository';

/** `PATCH /api/quotes/:id` — `draft` only, same freezing rule as `set-lines`. */
@Injectable()
export class UpdateQuoteHandler {
  constructor(
    @InjectPinoLogger(UpdateQuoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly quotes: QuoteRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateQuoteDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating quote ${id}`);

    const current = await this.quotes.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update quote: ${id} not found`);
      throw new NotFoundException('Quote not found');
    }
    if (current.status !== 'draft') {
      this.logger.warn(
        `Cannot update quote ${id}: status is ${current.status}, not draft`,
      );
      throw new BadRequestException(
        'Only a draft quote can be edited — it is frozen once sent',
      );
    }

    const updated = await this.quotes.update(id, {
      ...(dto.issue_date !== undefined && {
        issueDate: new Date(dto.issue_date),
      }),
      ...(dto.valid_until !== undefined && {
        validUntil: new Date(dto.valid_until),
      }),
      ...(dto.note !== undefined && { note: dto.note }),
    });
    const entity = toQuoteEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'quote',
      entityId: id,
      oldValue: toQuoteEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Quote updated: ${id}`);
    return entity;
  }
}
