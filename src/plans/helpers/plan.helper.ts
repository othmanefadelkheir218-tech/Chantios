import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toCamelKeys } from '../../common/helpers/case.helper';
import { PlanFeatureDto } from '../dto/create-plan.dto';

/** The rows to insert in `plan_features`, without the plan id. */
export type PlanFeatureData = Omit<
  Prisma.PlanFeatureUncheckedCreateInput,
  'planId'
>;

/**
 * Validates the feature list and turns it into rows.
 * `retention_days` is a value, not something billed: its overage is always 0.
 */
export function toFeatureRows(features: PlanFeatureDto[]): PlanFeatureData[] {
  const seen = new Set<string>();
  for (const { feature_key } of features) {
    if (seen.has(feature_key)) {
      throw new BadRequestException(`Duplicate feature_key: ${feature_key}`);
    }
    seen.add(feature_key);
  }
  return features.map((feature) => {
    const row = toCamelKeys<PlanFeatureData>(feature);
    return {
      ...row,
      overageRate:
        feature.feature_key === 'retention_days'
          ? '0'
          : (feature.overage_rate ?? '0'),
    };
  });
}

/** Builds the Prisma filter to search by name and by active flag. */
export function buildPlanFilter(
  search?: string,
  isActive?: boolean,
): Prisma.PlanWhereInput {
  return {
    ...(isActive !== undefined && { isActive }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };
}
