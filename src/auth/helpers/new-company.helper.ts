import { Prisma } from '@prisma/client';

/** `roles.id` of the `admin` role (seeded, the same id in every database). */
export const ADMIN_ROLE_ID = 1;

/** doc/notes/subscription-plans.md § "Decided — what a brand-new company gets". */
export const TRIAL_DAYS = 14;

/**
 * The `tenant_subscriptions` row every brand-new company gets, whether it
 * signed up itself or the super-admin created it: the default plan,
 * `trialing`, from now for `TRIAL_DAYS`.
 */
export function buildTrialSubscription(
  tenantId: number,
  defaultPlanId: number,
  now: Date = new Date(),
): Prisma.TenantSubscriptionUncheckedCreateInput {
  return {
    tenantId,
    planId: defaultPlanId,
    status: 'trialing',
    periodStart: now,
    periodEnd: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
  };
}
