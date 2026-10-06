import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPurchaseInvoiceEntity } from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/**
 * `GET /api/purchase-invoices/due-soon` — the query behind the
 * "purchase bill due" alert: unpaid bills due within `days`, overdue ones
 * included.
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
    // TODO: step 13 — raise the "purchase bill due" alert for these rows
    return rows.map(toPurchaseInvoiceEntity);
  }
}
