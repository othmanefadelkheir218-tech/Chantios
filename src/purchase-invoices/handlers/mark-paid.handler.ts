import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MarkPaidDto } from '../dto/mark-paid.dto';
import { toPurchaseInvoiceEntity } from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/**
 * `POST /api/purchase-invoices/:id/paid` — `status = 'paid'`, `paid_at`,
 * `payment_reference`. All or nothing: there is no payment ledger for money
 * out in v1 (one bill per instalment). The margin does NOT change — the cost
 * counted from the day the bill was entered.
 */
@Injectable()
export class MarkPaidHandler {
  constructor(
    @InjectPinoLogger(MarkPaidHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: PurchaseInvoiceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: MarkPaidDto, actor: AuthenticatedUser) {
    this.logger.info(`Marking purchase invoice ${id} as paid`);

    const current = await this.invoices.findById(id);
    if (!current) {
      this.logger.warn(`Cannot mark paid: purchase invoice ${id} not found`);
      throw new NotFoundException('Purchase invoice not found');
    }
    if (current.status === 'paid') {
      this.logger.warn(`Purchase invoice ${id} is already paid`);
      throw new ConflictException('This purchase invoice is already paid');
    }

    const updated = await this.invoices.markPaid(
      id,
      dto.paid_at ? new Date(dto.paid_at) : new Date(),
      dto.payment_reference,
    );
    const entity = toPurchaseInvoiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'mark_paid',
      entityType: 'purchase_invoice',
      entityId: id,
      oldValue: { status: current.status },
      newValue: {
        status: updated.status,
        paidAt: updated.paidAt,
        paymentReference: updated.paymentReference,
      },
      ipAddress: null,
    });
    this.logger.info(`Purchase invoice ${id} marked paid`);
    return entity;
  }
}
