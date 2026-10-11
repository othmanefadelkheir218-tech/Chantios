import type { TenantSubscription } from '@prisma/client';

type IdName = { id: number; name: string };

/**
 * Adds `tenantName`, `planName` and `pendingPlanName` to each row. A name that
 * can't be found (should not happen: foreign keys) falls back to `#<id>`.
 */
export function withListNames(
  rows: TenantSubscription[],
  tenants: IdName[],
  plans: IdName[],
) {
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));
  const planName = new Map(plans.map((p) => [p.id, p.name]));
  const nameOf = (map: Map<number, string>, id: number) =>
    map.get(id) ?? `#${id}`;
  return rows.map((row) => ({
    ...row,
    tenantName: nameOf(tenantName, row.tenantId),
    planName: nameOf(planName, row.planId),
    pendingPlanName: row.pendingPlanId
      ? nameOf(planName, row.pendingPlanId)
      : null,
  }));
}
