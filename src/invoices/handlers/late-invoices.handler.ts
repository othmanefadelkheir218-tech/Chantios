import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../notifications/notifications.service';
import { InvoiceRepository } from '../repositories/invoice.repository';

/** A late invoice alerts staff again only after this many days. */
const LATE_ALERT_REPEAT_DAYS = 7;

/**
 * The daily cron's business logic (`jobs/late-invoices.job.ts` calls this).
 * Reads every late invoice system-wide (`sent`/`partially_paid`, `due_date
 * < today`, `balance_due > 0`, already encoded in the `invoice_balance`
 * view) and **fires an alert only** — writes no status, ever
 * (client-invoices.md § "Late is calculated, never stored"). The alert goes to
 * the tenant's billing staff through `NotificationsService.dispatch`, once a
 * week per invoice. Chasing the CLIENT is the manual reminder
 * (`send-reminder.handler.ts`), never this cron.
 */
@Injectable()
export class LateInvoicesHandler {
  constructor(
    @InjectPinoLogger(LateInvoicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async execute() {
    const late = await this.invoices.findLate();

    for (const row of late) {
      this.logger.warn(
        `Invoice ${row.invoiceId} (tenant ${row.tenantId}) is late: balance due ${row.balanceDue.toString()}`,
      );
      await this.notifications.dispatch('invoice_late', {
        tenantId: row.tenantId,
        dedupeDays: LATE_ALERT_REPEAT_DAYS,
        payload: {
          entity_id: row.invoiceId,
          invoice_id: row.invoiceId,
          invoice_ref: row.invoiceRef,
          balance_due: row.balanceDue.toString(),
        },
      });
    }

    this.logger.info(`Late-invoice check: ${late.length} late invoice(s)`);
    return { lateCount: late.length };
  }
}
