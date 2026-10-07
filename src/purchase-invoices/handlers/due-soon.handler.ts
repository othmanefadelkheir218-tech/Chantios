import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPurchaseInvoiceEntity } from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/**
 * `GET /api/purchase-invoices/due-soon` — the query behind the
 * "purchase bill due" alert: unpaid bills due within `days`, overdue ones
 * included. A read only — the daily `purchase-due` cron
 * (`src/crons/purchase-due.cron.ts`) raises the alert from the same query.
 */
@Injectable()
export class DueSoonHandler {
  constructor(
    @InjectPinoLogger(DueSoonHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: PurchaseInvoiceRepository,
  ) {}

  async execute(days: number) {
    this.logger.debug(`Looking for purchase invoices due within ${days} days`);
    const rows = await this.invoices.findDueSoon(days);
    return rows.map(toPurchaseInvoiceEntity);
  }
}
