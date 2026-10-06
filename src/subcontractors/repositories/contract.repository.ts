import { Injectable } from '@nestjs/common';
import { ContractStatus, Prisma, SubcontractorContract } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/** Database access for `subcontractor_contracts`. */
@Injectable()
export class ContractRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(
    data: Prisma.SubcontractorContractUncheckedCreateInput,
  ): Promise<SubcontractorContract> {
    return this.tenantPrisma.db.subcontractorContract.create({ data });
  }

  findById(id: number): Promise<SubcontractorContract | null> {
    return this.tenantPrisma.db.subcontractorContract.findFirst({
      where: { id },
    });
  }

  async findMany(
    where: Prisma.SubcontractorContractWhereInput,
    skip: number,
    take: number,
  ): Promise<[SubcontractorContract[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.subcontractorContract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.subcontractorContract.count({ where }),
    ]);
  }

  update(
    id: number,
    data: Prisma.SubcontractorContractUpdateInput,
  ): Promise<SubcontractorContract> {
    return this.tenantPrisma.db.subcontractorContract.update({
      where: { id },
      data,
    });
  }

  setStatus(
    id: number,
    status: ContractStatus,
  ): Promise<SubcontractorContract> {
    return this.tenantPrisma.db.subcontractorContract.update({
      where: { id },
      data: { status },
    });
  }
}
