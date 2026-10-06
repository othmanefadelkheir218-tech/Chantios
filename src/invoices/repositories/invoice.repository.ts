import { Injectable } from '@nestjs/common';
import { Invoice, InvoiceLine, InvoiceStatus, Prisma } from '@prisma/client';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentTotals } from '../../documents/helpers/document-totals.helper';

export type InvoiceLineCreateInput = Omit<
  Prisma.InvoiceLineUncheckedCreateInput,
  'invoiceId'
>;

/** One row of the raw `invoice_balance` view, camelCased by the query's aliases. */
export interface InvoiceBalanceRow {
  invoiceId: number;
  tenantId: number;
  amountInclVat: Prisma.Decimal;
  amountPaid: Prisma.Decimal;
  balanceDue: Prisma.Decimal;
  isLate: boolean;
}

/**
 * The only place where the invoices module talks to the database —
 * `invoices` + `invoice_lines`. `invoice_balance` is a Postgres VIEW, not a
 * Prisma model (doc/Schema Proposal.md § 10) — every read of it goes
 * through `$queryRaw` with `tenant_id` passed explicitly (the tenant
 * extension only wraps model operations, never raw SQL), same pattern as
 * `material.repository.ts#findStockLevel`.
 */
@Injectable()
export class InvoiceRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(
    data: Omit<Prisma.InvoiceUncheckedCreateInput, 'number'>,
    lines: InvoiceLineCreateInput[],
    number: string,
    tx: TenantTransactionClient,
  ): Promise<Invoice> {
    const invoice = await tx.invoice.create({ data: { ...data, number } });
    if (lines.length > 0) {
      await tx.invoiceLine.createMany({
        data: lines.map((line) => ({ ...line, invoiceId: invoice.id })),
      });
    }
    return invoice;
  }

  findById(id: number): Promise<Invoice | null> {
    return this.tenantPrisma.db.invoice.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.InvoiceWhereInput,
    skip: number,
    take: number,
  ): Promise<[Invoice[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.invoice.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return this.tenantPrisma.db.invoice.update({ where: { id }, data });
  }

  async replaceLines(
    invoiceId: number,
    lines: InvoiceLineCreateInput[],
    tx: TenantTransactionClient,
  ): Promise<void> {
    await tx.invoiceLine.deleteMany({ where: { invoiceId } });
    if (lines.length > 0) {
      await tx.invoiceLine.createMany({
        data: lines.map((line) => ({ ...line, invoiceId })),
      });
    }
  }

  findLines(
    invoiceId: number,
    tx?: TenantTransactionClient,
  ): Promise<InvoiceLine[]> {
    return (tx ?? this.tenantPrisma.db).invoiceLine.findMany({
      where: { invoiceId },
      orderBy: { position: 'asc' },
    });
  }

  setTotals(
    invoiceId: number,
    totals: DocumentTotals,
    tx: TenantTransactionClient,
  ): Promise<Invoice> {
    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountExclVat: totals.amountExclVat,
        vatAmount: totals.vatAmount,
        amountInclVat: totals.amountInclVat,
      },
    });
  }

  setStatus(
    invoiceId: number,
    status: InvoiceStatus,
    timestamps: Partial<{ sentAt: Date }> = {},
    tx?: TenantTransactionClient,
  ): Promise<Invoice> {
    return (tx ?? this.tenantPrisma.db).invoice.update({
      where: { id: invoiceId },
      data: { status, ...timestamps },
    });
  }

  bumpReminder(id: number): Promise<Invoice> {
    return this.tenantPrisma.db.invoice.update({
      where: { id },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });
  }

  /** `GET /api/invoices/:id` and `record-payment.handler` — live balance for one invoice. `tx` for a read-your-write inside the payment transaction. */
  async findWithBalance(
    id: number,
    tx?: TenantTransactionClient,
  ): Promise<InvoiceBalanceRow | null> {
    const tenantId = this.currentTenantId();
    const client = tx ?? this.prisma;
    const rows = await client.$queryRaw<InvoiceBalanceRow[]>`
      SELECT invoice_id AS "invoiceId", tenant_id AS "tenantId",
             amount_incl_vat AS "amountInclVat", amount_paid AS "amountPaid",
             balance_due AS "balanceDue", is_late AS "isLate"
      FROM invoice_balance
      WHERE tenant_id = ${tenantId} AND invoice_id = ${id}
    `;
    return rows[0] ?? null;
  }

  /**
   * The daily late-invoice cron — system-wide, every tenant, not scoped to
   * the current request's tenant context (there is none for a cron job).
   * `is_late` already encodes "due_date < today AND balance_due > 0 AND
   * status IN (sent, partially_paid)" (see the view's own definition).
   */
  findLate(): Promise<InvoiceBalanceRow[]> {
    return this.prisma.$queryRaw<InvoiceBalanceRow[]>`
      SELECT invoice_id AS "invoiceId", tenant_id AS "tenantId",
             amount_incl_vat AS "amountInclVat", amount_paid AS "amountPaid",
             balance_due AS "balanceDue", is_late AS "isLate"
      FROM invoice_balance
      WHERE is_late = true
    `;
  }

  /**
   * `?late=true` on the list route: `invoice_balance.is_late` is computed by
   * the view, not a column, so it cannot be pushed into the `WHERE` of the
   * paginated `findMany` above. Fetches every invoice matching the other
   * filters, then filters by a batched raw read of the view and paginates
   * in memory — a deliberate simplification for a secondary filter (see
   * `find-invoices.handler.ts`), not the main list path.
   */
  async findManyLate(where: Prisma.InvoiceWhereInput): Promise<Invoice[]> {
    const all = await this.tenantPrisma.db.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (all.length === 0) return [];

    const tenantId = this.currentTenantId();
    const ids = all.map((invoice) => invoice.id);
    const lateRows = await this.prisma.$queryRaw<{ invoiceId: number }[]>`
      SELECT invoice_id AS "invoiceId"
      FROM invoice_balance
      WHERE tenant_id = ${tenantId} AND invoice_id IN (${Prisma.join(ids)}) AND is_late = true
    `;
    const lateIds = new Set(lateRows.map((row) => row.invoiceId));
    return all.filter((invoice) => lateIds.has(invoice.id));
  }

  /**
   * The coverage warning (`invoice-coverage.handler`): total invoiced excl.
   * VAT for a project, `cancelled` invoices excluded — a dropped invoice
   * was never really billed, so it should not count toward "did we invoice
   * the whole quote" (judgment call, doc/notes/client-invoices.md has no
   * explicit rule either way).
   */
  async sumByProject(projectId: number): Promise<Prisma.Decimal> {
    const result = await this.tenantPrisma.db.invoice.aggregate({
      where: { projectId, status: { not: 'cancelled' } },
      _sum: { amountExclVat: true },
    });
    return result._sum.amountExclVat ?? new Prisma.Decimal(0);
  }

  private currentTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new Error(
        'InvoiceRepository raw query ran with no tenant in context',
      );
    }
    return tenantId;
  }
}
