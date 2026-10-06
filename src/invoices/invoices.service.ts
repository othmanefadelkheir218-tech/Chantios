import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FindInvoicesQueryDto } from './dto/find-invoices-query.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SetInvoiceLinesDto } from './dto/set-invoice-lines.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CancelInvoiceHandler } from './handlers/cancel-invoice.handler';
import { CreateInvoiceHandler } from './handlers/create-invoice.handler';
import { FindInvoiceHandler } from './handlers/find-invoice.handler';
import { FindInvoicesHandler } from './handlers/find-invoices.handler';
import { FindPaymentsHandler } from './handlers/find-payments.handler';
import { InvoiceCoverageHandler } from './handlers/invoice-coverage.handler';
import { RecordPaymentHandler } from './handlers/record-payment.handler';
import { SendInvoiceHandler } from './handlers/send-invoice.handler';
import { SendReminderHandler } from './handlers/send-reminder.handler';
import { SetInvoiceLinesHandler } from './handlers/set-invoice-lines.handler';
import { UpdateInvoiceHandler } from './handlers/update-invoice.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class InvoicesService {
  constructor(
    private readonly createInvoice: CreateInvoiceHandler,
    private readonly findInvoices: FindInvoicesHandler,
    private readonly findInvoice: FindInvoiceHandler,
    private readonly updateInvoice: UpdateInvoiceHandler,
    private readonly setLines: SetInvoiceLinesHandler,
    private readonly sendInvoice: SendInvoiceHandler,
    private readonly cancelInvoice: CancelInvoiceHandler,
    private readonly recordPayment: RecordPaymentHandler,
    private readonly findPayments: FindPaymentsHandler,
    private readonly sendReminder: SendReminderHandler,
    private readonly invoiceCoverage: InvoiceCoverageHandler,
  ) {}

  create(dto: CreateInvoiceDto, actor: AuthenticatedUser) {
    return this.createInvoice.execute(dto, actor);
  }

  findAll(query: FindInvoicesQueryDto) {
    return this.findInvoices.execute(query);
  }

  findOne(id: number) {
    return this.findInvoice.execute(id);
  }

  update(id: number, dto: UpdateInvoiceDto, actor: AuthenticatedUser) {
    return this.updateInvoice.execute(id, dto, actor);
  }

  replaceLines(id: number, dto: SetInvoiceLinesDto, actor: AuthenticatedUser) {
    return this.setLines.execute(id, dto, actor);
  }

  send(id: number, actor: AuthenticatedUser) {
    return this.sendInvoice.execute(id, actor);
  }

  cancel(id: number, actor: AuthenticatedUser) {
    return this.cancelInvoice.execute(id, actor);
  }

  recordPaymentFor(
    id: number,
    dto: RecordPaymentDto,
    actor: AuthenticatedUser,
  ) {
    return this.recordPayment.execute(id, dto, actor);
  }

  payments(id: number) {
    return this.findPayments.execute(id);
  }

  sendReminderFor(id: number, actor: AuthenticatedUser) {
    return this.sendReminder.execute(id, actor);
  }

  coverageForProject(projectId: number) {
    return this.invoiceCoverage.execute(projectId);
  }
}
