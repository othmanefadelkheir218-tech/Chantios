import { BadRequestException } from '@nestjs/common';
import { Prisma, Service, ServiceMaterial } from '@prisma/client';

/** What may leave the module. */
export function toServiceEntity(service: Service) {
  return {
    id: service.id,
    tenantId: service.tenantId,
    categoryId: service.categoryId,
    description: service.description,
    unit: service.unit,
    priceExclVat: service.priceExclVat,
    defaultVatRate: service.defaultVatRate,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export function toRecipeRowEntity(row: ServiceMaterial) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    serviceId: row.serviceId,
    materialId: row.materialId,
    quantityPerUnit: row.quantityPerUnit,
  };
}

/** Builds the Prisma filter for the services list: category + search. */
export function buildServiceFilter(
  categoryId?: number,
  search?: string,
): Prisma.ServiceWhereInput {
  return {
    ...(categoryId !== undefined && { categoryId }),
    ...(search && {
      description: { contains: search, mode: 'insensitive' },
    }),
  };
}

/** `quantity_per_unit` must be strictly positive — backed by the DB CHECK too. */
export function assertPositiveQuantity(value: string): void {
  if (Number(value) <= 0) {
    throw new BadRequestException('quantity_per_unit must be greater than 0');
  }
}
