import { Injectable } from '@nestjs/common';
import { Prisma, Supplier } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/** The only place where the suppliers module talks to the database. */
@Injectable()
export class SupplierRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(data: Prisma.SupplierUncheckedCreateInput): Promise<Supplier> {
    return this.tenantPrisma.db.supplier.create({ data });
  }

  findById(id: number): Promise<Supplier | null> {
    return this.tenantPrisma.db.supplier.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.SupplierWhereInput,
    skip: number,
    take: number,
  ): Promise<[Supplier[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.supplier.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.SupplierUpdateInput): Promise<Supplier> {
    return this.tenantPrisma.db.supplier.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<Supplier> {
    return this.tenantPrisma.db.supplier.update({
      where: { id },
      data: { isActive },
    });
  }
}
