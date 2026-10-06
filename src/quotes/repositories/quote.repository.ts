import { Injectable } from '@nestjs/common';
import { Prisma, Quote, QuoteLine, QuoteStatus } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';
import { DocumentTotals } from '../../documents/helpers/document-totals.helper';

export type QuoteLineCreateInput = Omit<
  Prisma.QuoteLineUncheckedCreateInput,
  'quoteId'
>;

/** The only place where the quotes module talks to the database — `quotes` + `quote_lines`. */
@Injectable()
export class QuoteRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * `number` is assigned by `DocumentsService.allocateNumber` just before
   * this call, inside the SAME transaction (`tx` required — a quote is
   * never created outside its own transaction, the number allocation needs
   * the lock). Lines are inserted here too so their `total_excl_vat`
   * (DB trigger) is visible to `findLines(quoteId, tx)` before commit.
   */
  async create(
    data: Omit<Prisma.QuoteUncheckedCreateInput, 'number'>,
    lines: QuoteLineCreateInput[],
    number: string,
    tx: TenantTransactionClient,
  ): Promise<Quote> {
    const quote = await tx.quote.create({ data: { ...data, number } });
    if (lines.length > 0) {
      await tx.quoteLine.createMany({
        data: lines.map((line) => ({ ...line, quoteId: quote.id })),
      });
    }
    return quote;
  }

  findById(id: number): Promise<Quote | null> {
    return this.tenantPrisma.db.quote.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.QuoteWhereInput,
    skip: number,
    take: number,
  ): Promise<[Quote[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.quote.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.QuoteUpdateInput): Promise<Quote> {
    return this.tenantPrisma.db.quote.update({ where: { id }, data });
  }

  /** Delete + insert, one transaction (`set-lines.handler`). `draft` only — checked by the caller. */
  async replaceLines(
    quoteId: number,
    lines: QuoteLineCreateInput[],
    tx: TenantTransactionClient,
  ): Promise<void> {
    await tx.quoteLine.deleteMany({ where: { quoteId } });
    if (lines.length > 0) {
      await tx.quoteLine.createMany({
        data: lines.map((line) => ({ ...line, quoteId })),
      });
    }
  }

  /**
   * `tx` optional: read-your-own-write visibility when called before the
   * creating/replacing transaction has committed (uncommitted rows are only
   * visible on the same transaction client), otherwise reads the committed
   * state through the regular tenant-scoped client.
   */
  findLines(
    quoteId: number,
    tx?: TenantTransactionClient,
  ): Promise<QuoteLine[]> {
    return (tx ?? this.tenantPrisma.db).quoteLine.findMany({
      where: { quoteId },
      orderBy: { position: 'asc' },
    });
  }

  setTotals(
    quoteId: number,
    totals: DocumentTotals,
    tx: TenantTransactionClient,
  ): Promise<Quote> {
    return tx.quote.update({
      where: { id: quoteId },
      data: {
        amountExclVat: totals.amountExclVat,
        vatAmount: totals.vatAmount,
        amountInclVat: totals.amountInclVat,
      },
    });
  }

  setStatus(
    quoteId: number,
    status: QuoteStatus,
    timestamps: Partial<{
      sentAt: Date;
      acceptedAt: Date;
      refusedAt: Date;
    }>,
    tx?: TenantTransactionClient,
  ): Promise<Quote> {
    return (tx ?? this.tenantPrisma.db).quote.update({
      where: { id: quoteId },
      data: { status, ...timestamps },
    });
  }

  /** The budget (step 10, `project_margin_live`): sum of accepted quotes for a project. */
  async sumAcceptedByProject(projectId: number): Promise<Prisma.Decimal> {
    const result = await this.tenantPrisma.db.quote.aggregate({
      where: { projectId, status: 'accepted' },
      _sum: { amountExclVat: true },
    });
    return result._sum.amountExclVat ?? new Prisma.Decimal(0);
  }
}
