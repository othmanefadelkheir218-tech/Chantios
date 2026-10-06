import { MarginAlertLevel, Prisma } from '@prisma/client';

/** Real cost reaches this % of the budget → ⚠️ warning to admin + manager. */
export const WARNING_THRESHOLD_PCT = 80;
/** Real cost reaches this % of the budget → 🔴 critical to admin + manager. */
export const CRITICAL_THRESHOLD_PCT = 95;

/**
 * The thresholds, written once (doc/notes/Phaces/10-margin.md):
 * `total_cost / budget_excl_vat × 100`. A project with no accepted quote has
 * a budget of 0 — there is nothing to compare to, so `null` (never a
 * divide-by-zero), and no level is reached.
 */
export function costRatioPct(
  totalCost: Prisma.Decimal.Value,
  budgetExclVat: Prisma.Decimal.Value,
): Prisma.Decimal | null {
  const budget = new Prisma.Decimal(budgetExclVat);
  if (budget.lessThanOrEqualTo(0)) return null;
  return new Prisma.Decimal(totalCost).dividedBy(budget).times(100);
}

/**
 * Every level the cost has reached right now. `critical` implies `warning`
 * (95 % is also past 80 %), so the result is `[]`, `['warning']` or
 * `['warning', 'critical']`.
 */
export function levelsReached(
  totalCost: Prisma.Decimal.Value,
  budgetExclVat: Prisma.Decimal.Value,
): MarginAlertLevel[] {
  const ratio = costRatioPct(totalCost, budgetExclVat);
  if (ratio === null) return [];
  const levels: MarginAlertLevel[] = [];
  if (ratio.greaterThanOrEqualTo(WARNING_THRESHOLD_PCT)) levels.push('warning');
  if (ratio.greaterThanOrEqualTo(CRITICAL_THRESHOLD_PCT))
    levels.push('critical');
  return levels;
}
