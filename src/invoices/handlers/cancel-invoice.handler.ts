import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toInvoiceEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

/**
 * `POST /api/invoices/:id/cancel` — `status = 'cancelled'`, number kept, no
 * renumbering (doc/notes/document-numbering.md). Allowed from any
 * non-cancelled status, payment state included: dropping an invoice is a
 * staff decision, not blocked by what has already been paid (same spirit
 * as `doc/notes/project_closing_guard.md` — unpaid invoices never block
 * project closure, so the reverse — payment status blocking a cancel — is
 * not assumed either; a judgment call, nothing in the step file says
 * otherwise).
 */
@Injectable()
export class CancelInvoiceHandler {
  constructor(
    @InjectPinoLogger(CancelInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Cancelling invoice ${id}`);

    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      this.logger.warn(`Cannot cancel invoice: ${id} not found`);
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    const updated = await this.invoices.setStatus(id, 'cancelled');
    const entity = toInvoiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'cancel',
      entityType: 'invoice',
      entityId: id,
      oldValue: { status: invoice.status },
      newValue: { status: 'cancelled' },
      ipAddress: null,
    });
    this.logger.info(
      `Invoice cancelled: ${id} (number ${invoice.number} kept)`,
    );
    return entity;
  }
}
