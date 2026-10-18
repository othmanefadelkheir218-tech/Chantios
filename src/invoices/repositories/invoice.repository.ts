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

/** The four groups of the analytics aging block (doc/notes/analytics.md). */
export type AgingBucket =
  'not_due' | 'late_1_30' | 'late_31_60' | 'late_60_plus';

/** One row of the raw `invoice_balance` view, camelCased by the query's aliases. */
export interface InvoiceBalanceRow {
  invoiceId: number;
  tenantId: number;
  amountInclVat: Prisma.Decimal;
  amountPaid: Prisma.Decimal;
  balanceDue: Prisma.Decimal;
  isLate: boolean;
  invoiceRef?: string;
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

  /**
   * Step 12 (client portal): a project's invoices in the given statuses,
   * newest first. The portal decides WHICH statuses the client may see.
   */
  findByProjectAndStatuses(
    projectId: number,
    statuses: InvoiceStatus[],
  ): Promise<Invoice[]> {
    return this.tenantPrisma.db.invoice.findMany({
      where: { projectId, status: { in: statuses } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  /** Live balance + late flag of many invoices, one read of the view (`tenant_id` by hand). */
  async findBalancesByIds(
    ids: number[],
  ): Promise<Map<number, InvoiceBalanceRow>> {
    if (ids.length === 0) return new Map();
    const tenantId = this.currentTenantId();
    const rows = await this.prisma.$queryRaw<InvoiceBalanceRow[]>`
      SELECT invoice_id AS "invoiceId", tenant_id AS "tenantId",
             amount_incl_vat AS "amountInclVat", amount_paid AS "amountPaid",
             balance_due AS "balanceDue", is_late AS "isLate"
      FROM invoice_balance
      WHERE tenant_id = ${tenantId} AND invoice_id IN (${Prisma.join(ids)})
    `;
    return new Map(rows.map((row) => [row.invoiceId, row]));
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
      SELECT b.invoice_id AS "invoiceId", b.tenant_id AS "tenantId",
             b.amount_incl_vat AS "amountInclVat", b.amount_paid AS "amountPaid",
             b.balance_due AS "balanceDue", b.is_late AS "isLate",
             i.number AS "invoiceRef"
      FROM invoice_balance b
      JOIN invoices i ON i.id = b.invoice_id AND i.tenant_id = b.tenant_id
      WHERE b.is_late = true
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

  /**
   * Dashboard (step 18): unpaid = `sent` / `partially_paid` with a balance
   * left; overdue = the view's own `is_late` (the one late rule). Count +
   * balance due for each, current tenant only.
   */
  async summarizeUnpaid(): Promise<{
    unpaidCount: number;
    unpaidBalance: Prisma.Decimal;
    overdueCount: number;
    overdueBalance: Prisma.Decimal;
  }> {
    const tenantId = this.currentTenantId();
    const rows = await this.prisma.$queryRaw<
      {
        unpaidCount: number;
        unpaidBalance: Prisma.Decimal;
        overdueCount: number;
        overdueBalance: Prisma.Decimal;
      }[]
    >`
      SELECT COUNT(*)::int AS "unpaidCount",
             COALESCE(SUM(b.balance_due), 0) AS "unpaidBalance",
             (COUNT(*) FILTER (WHERE b.is_late))::int AS "overdueCount",
             COALESCE(SUM(b.balance_due) FILTER (WHERE b.is_late), 0) AS "overdueBalance"
      FROM invoice_balance b
      JOIN invoices i ON i.id = b.invoice_id AND i.tenant_id = b.tenant_id
      WHERE b.tenant_id = ${tenantId}
        AND i.status IN ('sent', 'partially_paid')
        AND b.balance_due > 0
    `;
    return rows[0];
  }

  /**
   * Analytics (step 22): total incl. VAT of the invoices ISSUED per day
   * between two `issue_date`s (inclusive). `draft` and `cancelled` were
   * never really billed, so they do not count.
   */
  async sumIssuedByDay(
    from: Date,
    to: Date,
  ): Promise<{ day: Date; amount: Prisma.Decimal }[]> {
    const rows = await this.tenantPrisma.db.invoice.groupBy({
      by: ['issueDate'],
      where: {
        issueDate: { gte: from, lte: to },
        status: { notIn: ['draft', 'cancelled'] },
      },
      _sum: { amountInclVat: true },
    });
    return rows.map((row) => ({
      day: row.issueDate,
      amount: row._sum.amountInclVat ?? new Prisma.Decimal(0),
    }));
  }

  /**
   * Analytics (step 22): the clients with the most invoiced (incl. VAT) on
   * the invoices issued between two dates — same invoices as
   * `sumIssuedByDay` — with what was paid on those invoices.
   */
  findTopClientsBetween(
    from: Date,
    to: Date,
    limit: number,
  ): Promise<
    { clientId: number; invoiced: Prisma.Decimal; collected: Prisma.Decimal }[]
  > {
    const tenantId = this.currentTenantId();
    return this.prisma.$queryRaw`
      SELECT i.client_id AS "clientId",
             SUM(i.amount_incl_vat) AS invoiced,
             COALESCE(SUM(b.amount_paid), 0) AS collected
      FROM invoices i
      JOIN invoice_balance b ON b.invoice_id = i.id AND b.tenant_id = i.tenant_id
      WHERE i.tenant_id = ${tenantId}
        AND i.issue_date BETWEEN ${from}::date AND ${to}::date
        AND i.status NOT IN ('draft', 'cancelled')
      GROUP BY i.client_id
      ORDER BY invoiced DESC, i.client_id ASC
      LIMIT ${limit}
    `;
  }

  /**
   * Analytics (step 22): the unpaid invoices of `summarizeUnpaid` in four
   * groups. Not late = the view's own `is_late` is false (the one late
   * rule); a late one goes by days since `due_date`.
   */
  async summarizeAging(): Promise<
    { bucket: AgingBucket; count: number; balanceDue: Prisma.Decimal }[]
  > {
    const tenantId = this.currentTenantId();
    return this.prisma.$queryRaw`
      SELECT x.bucket, COUNT(*)::int AS count,
             COALESCE(SUM(x.balance_due), 0) AS "balanceDue"
      FROM (
        SELECT b.balance_due,
               CASE WHEN NOT b.is_late THEN 'not_due'
                    WHEN CURRENT_DATE - i.due_date <= 30 THEN 'late_1_30'
                    WHEN CURRENT_DATE - i.due_date <= 60 THEN 'late_31_60'
                    ELSE 'late_60_plus' END AS bucket
        FROM invoice_balance b
        JOIN invoices i ON i.id = b.invoice_id AND i.tenant_id = b.tenant_id
        WHERE b.tenant_id = ${tenantId}
          AND i.status IN ('sent', 'partially_paid')
          AND b.balance_due > 0
      ) x
      GROUP BY x.bucket
    `;
  }
}
