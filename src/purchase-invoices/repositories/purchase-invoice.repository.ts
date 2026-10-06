import { Injectable } from '@nestjs/common';
import { Prisma, PurchaseInvoice } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';

/** The only place where the purchase-invoices module talks to the database. */
@Injectable()
export class PurchaseInvoiceRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /**
   * `number` is assigned by `DocumentsService.allocateNumber` just before this
   * call, inside the SAME transaction (`tx` required — the number allocation
   * needs the row lock). The `trg_material_bill_no_project` trigger fires here.
   */
  create(
    data: Omit<Prisma.PurchaseInvoiceUncheckedCreateInput, 'number'>,
    number: string,
    tx: TenantTransactionClient,
  ): Promise<PurchaseInvoice> {
    return tx.purchaseInvoice.create({ data: { ...data, number } });
  }

  findById(id: number): Promise<PurchaseInvoice | null> {
    return this.tenantPrisma.db.purchaseInvoice.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.PurchaseInvoiceWhereInput,
    skip: number,
    take: number,
  ): Promise<[PurchaseInvoice[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.purchaseInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.purchaseInvoice.count({ where }),
    ]);
  }

  update(
    id: number,
    data: Prisma.PurchaseInvoiceUncheckedUpdateInput,
  ): Promise<PurchaseInvoice> {
    return this.tenantPrisma.db.purchaseInvoice.update({
      where: { id },
      data,
    });
  }

  /** `to_pay` → `paid`. The margin never reads this — a bill counts from entry. */
  markPaid(
    id: number,
    paidAt: Date,
    paymentReference?: string,
  ): Promise<PurchaseInvoice> {
    return this.tenantPrisma.db.purchaseInvoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt,
        ...(paymentReference !== undefined && { paymentReference }),
      },
    });
  }

  /** Unpaid bills due on or before today + `days` (overdue ones included), soonest first. */
  findDueSoon(days: number): Promise<PurchaseInvoice[]> {
    const limit = new Date();
    limit.setUTCDate(limit.getUTCDate() + days);
    return this.tenantPrisma.db.purchaseInvoice.findMany({
      where: { status: 'to_pay', dueDate: { not: null, lte: limit } },
      orderBy: { dueDate: 'asc' },
    });
  }
}
