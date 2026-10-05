import { Prisma } from '@prisma/client';

/** `max(0, actual - allowance) × rate`, rounded to 2 decimals. */
export function computeOverageAmount(
  actualCount: number,
  includedAllowance: number,
  overageRate: Prisma.Decimal.Value,
): Prisma.Decimal {
  const over = new Prisma.Decimal(actualCount).minus(includedAllowance);
  if (over.lte(0)) return new Prisma.Decimal(0);
  return over.times(overageRate).toDecimalPlaces(2);
}
