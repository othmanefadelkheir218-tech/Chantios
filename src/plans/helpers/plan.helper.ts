import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toCamelKeys } from '../../common/helpers/case.helper';
import {
  FEATURE_KEYS,
  OPTIONAL_FEATURE_KEYS,
  PlanFeatureDto,
} from '../dto/create-plan.dto';
import type { PlanWithFeatures } from '../repositories/plan.repository';

/** The rows to insert in `plan_features`, without the plan id. */
export type PlanFeatureData = Omit<
  Prisma.PlanFeatureUncheckedCreateInput,
  'planId'
>;

/**
 * Validates the feature list and turns it into rows. The 6 first
 * `FEATURE_KEYS` are required, no more, no fewer — see
 * doc/notes/subscription-plans.md § "all 6 feature keys are required".
 * `email_mailboxes` (step 25) is optional: left out = mailboxes not billed. `retention_days` is a value, not
 * something billed: its overage is always 0.
 */
export function toFeatureRows(features: PlanFeatureDto[]): PlanFeatureData[] {
  const seen = new Set<string>();
  for (const { feature_key } of features) {
    if (seen.has(feature_key)) {
      throw new BadRequestException(`Duplicate feature_key: ${feature_key}`);
    }
    seen.add(feature_key);
  }
  const required = FEATURE_KEYS.filter(
    (key) => !OPTIONAL_FEATURE_KEYS.includes(key),
  );
  const missing = required.filter((key) => !seen.has(key));
  if (missing.length > 0) {
    throw new BadRequestException(
      `All ${required.length} features are required. Missing: ${missing.join(', ')}`,
    );
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

/**
 * What the public pricing page may see — an allow-list: never
 * `stripe_price_id`, `parent_plan_id` or a subscriber count
 * (doc/notes/subscription-plans.md § Public plan list).
 */
export function toPublicPlan(plan: PlanWithFeatures) {
  return {
    id: plan.id,
    name: plan.name,
    basePrice: plan.basePrice,
    isDefault: plan.isDefault,
    features: plan.features.map((feature) => ({
      featureKey: feature.featureKey,
      limitValue: feature.limitValue,
      overageRate: feature.overageRate,
    })),
  };
}
