import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toInvoiceEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';

/** `GET /api/invoices/:id` — with lines and the live `invoice_balance`. */
@Injectable()
export class FindInvoiceHandler {
  constructor(
    @InjectPinoLogger(FindInvoiceHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
  ) {}

  async execute(id: number) {
    const invoice = await this.invoices.findById(id);
    if (!invoice) {
      this.logger.warn(`Invoice ${id} not found`);
      throw new NotFoundException('Invoice not found');
    }
    const lines = await this.invoices.findLines(id);
    const balance = await this.invoices.findWithBalance(id);
    return {
      ...toInvoiceEntity(invoice, lines),
      balance: balance && {
        amountPaid: balance.amountPaid,
        balanceDue: balance.balanceDue,
        isLate: balance.isLate,
      },
    };
  }
}
