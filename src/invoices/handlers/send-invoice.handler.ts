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
import { FreezeInvoicePdfHandler } from './freeze-invoice-pdf.handler';
import { toInvoiceEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

/**
 * `POST /api/invoices/:id/send` — `draft -> sent`, `sent_at` set. Lines and
 * totals are locked from here. Refuses (400) with zero lines or no (active)
 * client — `client_id` is required at creation, so this re-check only
 * matters if the client was archived in the meantime.
 *
 * Ordering matters (doc/notes/Phaces/15-documents.md "Wiring into send"):
 * the PDF is rendered and uploaded to `media` (`is_locked = true`) WHILE the
 * invoice is still `draft`, BEFORE `setStatus('sent', ...)`. A render/upload
 * failure propagates — the invoice stays `draft`, no email sent.
 */
@Injectable()
export class SendInvoiceHandler {
  constructor(
    @InjectPinoLogger(SendInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly clients: ClientsService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly freezePdf: FreezeInvoicePdfHandler,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Sending invoice ${id}`);

    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      this.logger.warn(`Cannot send invoice: ${id} not found`);
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        `Cannot send an invoice from status ${invoice.status}`,
      );
    }

    const client = await this.clients.findByIdRaw(invoice.clientId);
    if (!client || !client.isActive) {
      this.logger.warn(
        `Cannot send invoice ${id}: client ${invoice.clientId} not found or archived`,
      );
      throw new BadRequestException(
        'Cannot send an invoice with no active client',
      );
    }

    const lines = await this.invoices.findLines(id);
    if (lines.length === 0) {
      this.logger.warn(`Cannot send invoice ${id}: no lines`);
      throw new BadRequestException('Cannot send an invoice with no lines');
    }

    // Freeze the PDF BEFORE the status flips — see the class doc comment.
    const { buffer } = await this.freezePdf.execute(invoice, lines, actor);

    const updated = await this.invoices.setStatus(id, 'sent', {
      sentAt: new Date(),
    });

    // The "please pay" email, the frozen PDF attached.
    await this.notifications.dispatch('client_invoice_sent', {
      tenantId: actor.tenantId,
      clientEmail: client.email,
      payload: {
        invoice_ref: updated.number,
        amount: updated.amountInclVat.toString(),
      },
      attachment: {
        filename: `${updated.number}.pdf`,
        content: buffer.toString('base64'),
      },
    });

    const entity = toInvoiceEntity(updated, lines);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'send',
      entityType: 'invoice',
      entityId: id,
      oldValue: { status: invoice.status },
      newValue: { status: 'sent' },
      ipAddress: null,
    });
    this.logger.info(`Invoice sent: ${id}`);
    return entity;
  }
}
