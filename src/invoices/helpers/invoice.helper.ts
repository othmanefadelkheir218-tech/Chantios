import { BadRequestException } from '@nestjs/common';
import {
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  Payment,
  Prisma,
} from '@prisma/client';
import { VatLine } from '../../documents/helpers/document-totals.helper';

/** What may leave the module. */
export function toInvoiceEntity(invoice: Invoice, lines?: InvoiceLine[]) {
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    quoteId: invoice.quoteId,
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    defaultVatRate: invoice.defaultVatRate,
    amountExclVat: invoice.amountExclVat,
    vatAmount: invoice.vatAmount,
    amountInclVat: invoice.amountInclVat,
    note: invoice.note,
    sentAt: invoice.sentAt,
    reminderCount: invoice.reminderCount,
    lastReminderAt: invoice.lastReminderAt,
    createdBy: invoice.createdBy,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    ...(lines && { lines: lines.map(toInvoiceLineEntity) }),
  };
}

export function toInvoiceLineEntity(line: InvoiceLine) {
  return {
    id: line.id,
    tenantId: line.tenantId,
    invoiceId: line.invoiceId,
    serviceId: line.serviceId,
    description: line.description,
    unit: line.unit,
    quantity: line.quantity,
    unitPriceExclVat: line.unitPriceExclVat,
    vatRate: line.vatRate,
    totalExclVat: line.totalExclVat,
    position: line.position,
  };
}

export function toPaymentEntity(payment: Payment) {
  return {
    id: payment.id,
    tenantId: payment.tenantId,
    invoiceId: payment.invoiceId,
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    paymentDate: payment.paymentDate,
    createdBy: payment.createdBy,
    createdAt: payment.createdAt,
  };
}

export function toVatLine(line: InvoiceLine): VatLine {
  return { totalExclVat: line.totalExclVat, vatRate: line.vatRate };
}

/** Builds the Prisma filter for the invoices list: project, status. `late` is applied separately (the view, not a column). */
export function buildInvoiceFilter(
  projectId?: number,
  status?: InvoiceStatus,
): Prisma.InvoiceWhereInput {
  return {
    ...(projectId !== undefined && { projectId }),
    ...(status !== undefined && { status }),
  };
}

/** `quantity` must be non-zero — backed by the DB CHECK too. */
export function assertNonZeroQuantity(value: string): void {
  if (Number(value) === 0) {
    throw new BadRequestException('quantity cannot be zero');
  }
}

/** `amount` must be strictly positive — backed by `chk_payment_positive` too. */
export function assertPositiveAmount(value: string): void {
  if (Number(value) <= 0) {
    throw new BadRequestException('amount must be greater than 0');
  }
}

/**
 * `due_date` defaults to `issue_date + tenants.default_payment_days`
 * (client-invoices.md § "Why due_date cannot be empty"). Date-only math —
 * both inputs are DATE columns, no time component.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
