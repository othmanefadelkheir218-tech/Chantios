import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { toInvoiceEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

/** `PATCH /api/invoices/:id` — `draft` only, same freezing rule as `set-lines`. */
@Injectable()
export class UpdateInvoiceHandler {
  constructor(
    @InjectPinoLogger(UpdateInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateInvoiceDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating invoice ${id}`);

    const current = await this.invoices.findById(id);
    if (!current) {
      this.logger.warn(`Cannot update invoice: ${id} not found`);
      throw new NotFoundException('Invoice not found');
    }
    if (current.status !== 'draft') {
      this.logger.warn(
        `Cannot update invoice ${id}: status is ${current.status}, not draft`,
      );
      throw new BadRequestException(
        'Only a draft invoice can be edited — it is frozen once sent',
      );
    }

    const updated = await this.invoices.update(id, {
      ...(dto.issue_date !== undefined && {
        issueDate: new Date(dto.issue_date),
      }),
      ...(dto.due_date !== undefined && { dueDate: new Date(dto.due_date) }),
      ...(dto.note !== undefined && { note: dto.note }),
    });
    const entity = toInvoiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'update',
      entityType: 'invoice',
      entityId: id,
      oldValue: toInvoiceEntity(current),
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Invoice updated: ${id}`);
    return entity;
  }
}
