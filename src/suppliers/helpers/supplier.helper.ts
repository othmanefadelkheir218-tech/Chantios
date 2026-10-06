import { Prisma, Supplier } from '@prisma/client';

/** What may leave the module. Internal only — never shown in the portal. */
export function toSupplierEntity(supplier: Supplier) {
  return {
    id: supplier.id,
    tenantId: supplier.tenantId,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    vatNumber: supplier.vatNumber,
    isActive: supplier.isActive,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

/** Builds the Prisma filter for the supplier list: search + active state. */
export function buildSupplierFilter(
  search?: string,
  isActive?: boolean,
): Prisma.SupplierWhereInput {
  return {
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}
