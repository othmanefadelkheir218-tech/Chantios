import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Over this many hours in one day (all projects together) the entry is saved but a manager is alerted. */
export const ABNORMAL_DAILY_HOURS = 12;
/** Over this many hours in one day is physically impossible — rejected. */
export const MAX_DAILY_HOURS = 24;

/**
 * The daily-hours rule, written once (doc/notes/Phaces/08-planning-time.md).
 * A per-row `hours <= 24` is not enough — 20h on project A plus 20h on
 * project B both pass it — so the caller passes the SUM of the employee's
 * OTHER rows for that `work_date`, across every project (the row being
 * edited is excluded by the repository, never counted against itself).
 *
 *   total <= 12h  -> saved
 *   total  > 12h  -> saved + abnormal-hours alert to the manager
 *   total  > 24h  -> rejected
 */
export function checkDailyTotal(
  otherHours: Prisma.Decimal.Value,
  newHours: Prisma.Decimal.Value,
  workDate: string,
): { total: Prisma.Decimal; abnormal: boolean } {
  const total = new Prisma.Decimal(otherHours).plus(
    new Prisma.Decimal(newHours),
  );
  if (total.greaterThan(MAX_DAILY_HOURS)) {
    throw new BadRequestException(
      `This would bring the total for ${workDate} to ${total.toFixed(2)}h across all projects — the maximum is ${MAX_DAILY_HOURS}h in a day`,
    );
  }
  return { total, abnormal: total.greaterThan(ABNORMAL_DAILY_HOURS) };
}
