import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPurchaseInvoiceEntity } from '../helpers/purchase-invoice.helper';
import { PurchaseInvoiceRepository } from '../repositories/purchase-invoice.repository';

/** `GET /api/purchase-invoices/:id`. */
@Injectable()
export class FindPurchaseInvoiceHandler {
  constructor(
    @InjectPinoLogger(FindPurchaseInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: PurchaseInvoiceRepository,
  ) {}

  async execute(id: number) {
    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      this.logger.warn(`Purchase invoice ${id} not found`);
      throw new NotFoundException('Purchase invoice not found');
    }
    return toPurchaseInvoiceEntity(invoice);
  }
}
