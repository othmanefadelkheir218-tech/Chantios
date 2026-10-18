import { BadRequestException } from '@nestjs/common';
import { addDays } from '../../common/helpers/tenant-local-time.helper';

/** The longest period one call may ask for (doc/notes/analytics.md § The period). */
export const MAX_PERIOD_MONTHS = 24;

/** The default period: this month and the 11 before it. */
const DEFAULT_PERIOD_MONTHS = 12;

export interface AnalyticsPeriod {
  /** `YYYY-MM-DD`, inclusive. */
  from: string;
  /** `YYYY-MM-DD`, inclusive. */
  to: string;
  /** Every month of the period, `YYYY-MM`, oldest first — an empty month still has its place. */
  months: string[];
}

/** A `YYYY-MM-DD` day as a `@db.Date` value (UTC midnight). */
export const toDbDate = (day: string) => new Date(`${day}T00:00:00.000Z`);

/** `YYYY-MM` of a `YYYY-MM-DD` day moved by `count` months (the day becomes the 1st). */
function shiftMonth(day: string, count: number): string {
  const moment = toDbDate(`${day.slice(0, 7)}-01`);
  moment.setUTCMonth(moment.getUTCMonth() + count);
  return moment.toISOString().slice(0, 7);
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let month = from.slice(0, 7);
  while (month <= to.slice(0, 7)) {
    months.push(month);
    month = shiftMonth(`${month}-01`, 1);
  }
  return months;
}

/**
 * The period of one call. No `from` → the 1st of the month 11 months before
 * `to`; no `to` → `today` (tenant timezone). `from` after `to`, or more than
 * 24 months, is refused.
 */
export function resolvePeriod(
  query: { from?: string; to?: string },
  today: string,
): AnalyticsPeriod {
  const to = query.to ?? today;
  const from =
    query.from ?? `${shiftMonth(to, -(DEFAULT_PERIOD_MONTHS - 1))}-01`;
  if (from > to) {
    throw new BadRequestException('from must not be after to');
  }
  const months = monthsBetween(from, to);
  if (months.length > MAX_PERIOD_MONTHS) {
    throw new BadRequestException(
      `The period is ${MAX_PERIOD_MONTHS} months at most`,
    );
  }
  return { from, to, months };
}

/**
 * The UTC moments that surely hold every local day of the period, whatever
 * the timezone (one day of margin on each side). A timestamp read with it
 * is then placed in its local day by `localMonthIn`.
 */
export function periodMoments(period: AnalyticsPeriod): {
  from: Date;
  to: Date;
} {
  return {
    from: toDbDate(addDays(period.from, -1)),
    to: toDbDate(addDays(period.to, 2)),
  };
}
