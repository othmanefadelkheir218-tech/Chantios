import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InvoiceRepository } from '../repositories/invoice.repository';

/**
 * The daily cron's business logic (`jobs/late-invoices.job.ts` calls this).
 * Reads every late invoice system-wide (`sent`/`partially_paid`, `due_date
 * < today`, `balance_due > 0`, already encoded in the `invoice_balance`
 * view) and **fires an alert only** — writes no status, ever
 * (client-invoices.md § "Late is calculated, never stored"). Real alert
 * delivery is step 13's job; a log statement is the placeholder here, same
 * as `stock/handlers/check-coverage.handler.ts`'s `// TODO: step 13`.
 */
@Injectable()
export class LateInvoicesHandler {
  constructor(
    @InjectPinoLogger(LateInvoicesHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
  ) {}

  async execute() {
    const late = await this.invoices.findLate();

    for (const row of late) {
      this.logger.warn(
        `Invoice ${row.invoiceId} (tenant ${row.tenantId}) is late: balance due ${row.balanceDue.toString()}`,
      );
      // TODO: step 13 — fire the real alert to the tenant admin here (the
      // notifications/alerts module does not exist yet).
    }

    this.logger.info(`Late-invoice check: ${late.length} late invoice(s)`);
    return { lateCount: late.length };
  }
}
