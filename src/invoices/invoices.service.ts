import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
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
import { InvoiceRepository } from './repositories/invoice.repository';

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
    private readonly invoices: InvoiceRepository,
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

  // ---- Internal API for step 12 (client portal) ----

  /** A project's invoices in the given statuses, each with its live balance and late flag. */
  async findByProjectWithBalance(projectId: number, statuses: InvoiceStatus[]) {
    const invoices = await this.invoices.findByProjectAndStatuses(
      projectId,
      statuses,
    );
    const balances = await this.invoices.findBalancesByIds(
      invoices.map((invoice) => invoice.id),
    );
    return invoices.map((invoice) => ({
      invoice,
      balance: balances.get(invoice.id) ?? null,
    }));
  }

  /** The raw invoice row, scoped to the current tenant, or `null`. */
  findByIdRaw(id: number) {
    return this.invoices.findById(id);
  }
}
