import { Injectable } from '@nestjs/common';
import { ImportBatch, ImportType, Prisma } from '@prisma/client';
import {
  TenantPrismaService,
  TenantTransactionClient,
} from '../../common/prisma/tenant-prisma.service';

/** The only place where the imports module talks to the database. */
@Injectable()
export class ImportBatchRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(data: Prisma.ImportBatchUncheckedCreateInput): Promise<ImportBatch> {
    return this.tenantPrisma.db.importBatch.create({ data });
  }

  findById(id: number): Promise<ImportBatch | null> {
    return this.tenantPrisma.db.importBatch.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.ImportBatchWhereInput,
    skip: number,
    take: number,
  ): Promise<[ImportBatch[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.importBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.importBatch.count({ where }),
    ]);
  }

  /** A batch with the same rows that did not fail — a repeat of it is refused. */
  findActiveByHash(
    type: ImportType,
    rowsHash: string,
  ): Promise<ImportBatch | null> {
    return this.tenantPrisma.db.importBatch.findFirst({
      where: { type, rowsHash, status: { not: 'failed' } },
    });
  }

  update(
    id: number,
    data: Prisma.ImportBatchUpdateInput,
    tx?: TenantTransactionClient,
  ): Promise<ImportBatch> {
    return (tx ?? this.tenantPrisma.db).importBatch.update({
      where: { id },
      data,
    });
  }
}
