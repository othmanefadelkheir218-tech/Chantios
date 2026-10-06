import { Injectable } from '@nestjs/common';
import { Prisma, Service, ServiceMaterial } from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the services module talks to the database — for both
 * `services` and `service_materials` (the recipe). The recipe belongs to
 * the service domain on purpose (doc/notes/Phaces/05-Catalogue & Stock.md).
 */
@Injectable()
export class ServiceRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  create(data: Prisma.ServiceUncheckedCreateInput): Promise<Service> {
    return this.tenantPrisma.db.service.create({ data });
  }

  findById(id: number): Promise<Service | null> {
    return this.tenantPrisma.db.service.findFirst({ where: { id } });
  }

  async findMany(
    where: Prisma.ServiceWhereInput,
    skip: number,
    take: number,
  ): Promise<[Service[], number]> {
    return this.tenantPrisma.db.$transaction([
      this.tenantPrisma.db.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tenantPrisma.db.service.count({ where }),
    ]);
  }

  update(id: number, data: Prisma.ServiceUpdateInput): Promise<Service> {
    return this.tenantPrisma.db.service.update({ where: { id }, data });
  }

  setActive(id: number, isActive: boolean): Promise<Service> {
    return this.tenantPrisma.db.service.update({
      where: { id },
      data: { isActive },
    });
  }

  findRecipe(serviceId: number): Promise<ServiceMaterial[]> {
    return this.tenantPrisma.db.serviceMaterial.findMany({
      where: { serviceId },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * `PUT /api/services/:id/recipe` — delete then insert, one transaction.
   * An empty `items` array is valid: it clears the recipe. Runs on the
   * tenant-scoped client so both the `deleteMany` and the `createMany`
   * still get `tenant_id` injected by the extension inside the transaction.
   */
  async replaceRecipe(
    serviceId: number,
    tenantId: number,
    items: Array<{ materialId: number; quantityPerUnit: string }>,
  ): Promise<void> {
    await this.tenantPrisma.db.$transaction(async (tx) => {
      await tx.serviceMaterial.deleteMany({ where: { serviceId } });
      if (items.length > 0) {
        await tx.serviceMaterial.createMany({
          data: items.map((item) => ({
            tenantId,
            serviceId,
            materialId: item.materialId,
            quantityPerUnit: item.quantityPerUnit,
          })),
        });
      }
    });
  }
}
