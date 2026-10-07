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
import { toInvoiceEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

/**
 * `POST /api/invoices/:id/reminder` — staff sends a reminder manually,
 * bumps `reminder_count` and `last_reminder_at` (client-invoices.md §
 * Reminders) and emails the client the reminder. Refuses a `draft` or `cancelled` invoice — there is nothing
 * to chase a client for yet, or anymore.
 */
@Injectable()
export class SendReminderHandler {
  constructor(
    @InjectPinoLogger(SendReminderHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly audit: AuditService,
    private readonly clients: ClientsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Sending reminder for invoice ${id}`);

    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      this.logger.warn(`Cannot send reminder: invoice ${id} not found`);
      throw new NotFoundException('Invoice not found');
    }
    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot send a reminder for a ${invoice.status} invoice`,
      );
    }

    const updated = await this.invoices.bumpReminder(id);

    const client = await this.clients.findByIdRaw(invoice.clientId);
    const balance = await this.invoices.findWithBalance(id);
    if (client) {
      await this.notifications.dispatch('client_invoice_late', {
        tenantId: actor.tenantId,
        clientEmail: client.email,
        payload: {
          invoice_ref: invoice.number,
          balance_due: (
            balance?.balanceDue ?? invoice.amountInclVat
          ).toString(),
        },
      });
    }
    const entity = toInvoiceEntity(updated);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'send_reminder',
      entityType: 'invoice',
      entityId: id,
      newValue: { reminderCount: updated.reminderCount },
      ipAddress: null,
    });
    this.logger.info(
      `Reminder sent for invoice ${id}: reminder_count now ${updated.reminderCount}`,
    );
    return entity;
  }
}
