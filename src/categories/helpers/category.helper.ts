import { Category } from '@prisma/client';

/** What may leave the module. */
export function toCategoryEntity(category: Category) {
  return {
    id: category.id,
    tenantId: category.tenantId,
    name: category.name,
    isActive: category.isActive,
    createdAt: category.createdAt,
  };
}
