import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { FindPurchaseInvoicesQueryDto } from './dto/find-purchase-invoices-query.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { CreatePurchaseInvoiceHandler } from './handlers/create-purchase-invoice.handler';
import { DueSoonHandler } from './handlers/due-soon.handler';
import { FindPurchaseInvoiceHandler } from './handlers/find-purchase-invoice.handler';
import { FindPurchaseInvoicesHandler } from './handlers/find-purchase-invoices.handler';
import { MarkPaidHandler } from './handlers/mark-paid.handler';
import { UpdatePurchaseInvoiceHandler } from './handlers/update-purchase-invoice.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private readonly createInvoice: CreatePurchaseInvoiceHandler,
    private readonly findInvoices: FindPurchaseInvoicesHandler,
    private readonly findInvoice: FindPurchaseInvoiceHandler,
    private readonly updateInvoice: UpdatePurchaseInvoiceHandler,
    private readonly markInvoicePaid: MarkPaidHandler,
    private readonly dueSoonInvoices: DueSoonHandler,
  ) {}

  create(dto: CreatePurchaseInvoiceDto, actor: AuthenticatedUser) {
    return this.createInvoice.execute(dto, actor);
  }

  findAll(query: FindPurchaseInvoicesQueryDto) {
    return this.findInvoices.execute(query);
  }

  findOne(id: number) {
    return this.findInvoice.execute(id);
  }

  update(id: number, dto: UpdatePurchaseInvoiceDto, actor: AuthenticatedUser) {
    return this.updateInvoice.execute(id, dto, actor);
  }

  markPaid(id: number, dto: MarkPaidDto, actor: AuthenticatedUser) {
    return this.markInvoicePaid.execute(id, dto, actor);
  }

  dueSoon(days: number) {
    return this.dueSoonInvoices.execute(days);
  }
}
