import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaymentEntity } from '../helpers/invoice.helper';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { PaymentRepository } from '../repositories/payment.repository';

/** `GET /api/invoices/:id/payments` — the full ledger for one invoice, newest first. */
@Injectable()
export class FindPaymentsHandler {
  constructor(
    @InjectPinoLogger(FindPaymentsHandler.name)
    private readonly logger: PinoLogger,
    private readonly invoices: InvoiceRepository,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(invoiceId: number) {
    const invoice = await this.invoices.findById(invoiceId);
    if (!invoice) {
      this.logger.warn(`Cannot list payments: invoice ${invoiceId} not found`);
      throw new NotFoundException('Invoice not found');
    }
    const rows = await this.payments.findByInvoice(invoiceId);
    return rows.map(toPaymentEntity);
  }
}
