import { Injectable } from '@nestjs/common';
import { Prisma, Subcontractor } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/** The directory's database access. Contracts have their own file: `contract.repository.ts`. */
@Injectable()
export class SubcontractorRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(
    data: Prisma.SubcontractorUncheckedCreateInput,
  ): Promise<Subcontractor> {
    return this.tenantPrisma.db.subcontractor.create({ data });
  }

  findById(id: number): Promise<Subcontractor | null> {
    return this.tenantPrisma.db.subcontractor.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.SubcontractorWhereInput,
    skip: number,
    take: number,
  ): Promise<[Subcontractor[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.subcontractor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.subcontractor.count({ where }),
    ]);
  }

  update(
    id: number,
    data: Prisma.SubcontractorUpdateInput,
  ): Promise<Subcontractor> {
    return this.tenantPrisma.db.subcontractor.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<Subcontractor> {
    return this.tenantPrisma.db.subcontractor.update({
      where: { id },
      data: { isActive },
    });
  }

  /** The `max_subcontractors` billing dimension (step 14) — called through `SubcontractorsService` only. */
  countActive(): Promise<number> {
    return this.tenantPrisma.db.subcontractor.count({
      where: { isActive: true },
    });
  }
}
