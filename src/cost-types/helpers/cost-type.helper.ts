import { CostType } from '@prisma/client';

/** The seeded cost type whose bills may never carry a project (stock counts it). */
export const MATERIAL_COST_TYPE_NAME = 'material';

/** What may leave the module. */
export function toCostTypeEntity(costType: CostType) {
  return {
    id: costType.id,
    tenantId: costType.tenantId,
    name: costType.name,
    isActive: costType.isActive,
    createdAt: costType.createdAt,
  };
}
