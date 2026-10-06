import { BadRequestException } from '@nestjs/common';
import { Material, Prisma } from '@prisma/client';

/** What may leave the module. `materials` deliberately has no quantity column. */
export function toMaterialEntity(material: Material) {
  return {
    id: material.id,
    tenantId: material.tenantId,
    description: material.description,
    unit: material.unit,
    purchasePrice: material.purchasePrice,
    minimumStock: material.minimumStock,
    isActive: material.isActive,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
  };
}

/** One row of the raw `material_stock_live` view, camelCased by the query's aliases. */
export interface StockLevelRow {
  materialId: number;
  onHand: Prisma.Decimal;
  reserved: Prisma.Decimal;
  available: Prisma.Decimal;
}

/** A material entity merged with its live stock level. */
export function toMaterialWithStockEntity(
  material: Material,
  level: StockLevelRow | undefined,
) {
  return {
    ...toMaterialEntity(material),
    onHand: level?.onHand ?? new Prisma.Decimal(0),
    reserved: level?.reserved ?? new Prisma.Decimal(0),
    available: level?.available ?? new Prisma.Decimal(0),
  };
}

/** Builds the Prisma filter for the materials list: active + search. */
export function buildMaterialFilter(
  search?: string,
): Prisma.MaterialWhereInput {
  return {
    ...(search && {
      description: { contains: search, mode: 'insensitive' },
    }),
  };
}

/**
 * `purchase_price` / `minimum_stock` must never be negative. Enforced here
 * (not `@Min` on the DTO — see `create-material.dto.ts` for why) on the
 * numeric-string value a DTO already confirmed is a valid number.
 */
export function assertNonNegative(value: string, field: string): void {
  if (Number(value) < 0) {
    throw new BadRequestException(`${field} cannot be negative`);
  }
}
