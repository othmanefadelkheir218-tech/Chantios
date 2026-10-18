import { Injectable } from '@nestjs/common';
import { Payment, Prisma } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the invoices module talks to the database for
 * `payments` — the ledger. Append-only: no update/delete method exists
 * here on purpose (client-invoices.md § payments).
 */
@Injectable()
export class PaymentRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(
    data: Prisma.PaymentUncheckedCreateInput,
    tx?: TenantTransactionClient,
  ): Promise<Payment> {
    return (tx ?? this.tenantPrisma.db).payment.create({ data });
  }

  findByInvoice(invoiceId: number): Promise<Payment[]> {
    return this.tenantPrisma.db.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async sumByInvoice(invoiceId: number): Promise<Prisma.Decimal> {
    const result = await this.tenantPrisma.db.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  /** Analytics (step 22): money received per day between two `payment_date`s (inclusive), correction rows included. */
  async sumByDay(
    from: Date,
    to: Date,
  ): Promise<{ day: Date; amount: Prisma.Decimal }[]> {
    const rows = await this.tenantPrisma.db.payment.groupBy({
      by: ['paymentDate'],
      where: { paymentDate: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    return rows.map((row) => ({
      day: row.paymentDate,
      amount: row._sum.amount ?? new Prisma.Decimal(0),
    }));
  }
}
