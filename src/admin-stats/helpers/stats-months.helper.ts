import { localMoment } from '../../common/helpers/tenant-local-time.helper';

/** The platform's own clock: ChantierOS runs from Belgium. */
export const PLATFORM_TIMEZONE = 'Europe/Brussels';

/** How many months the growth chart shows, the current one included. */
export const GROWTH_MONTHS = 12;

/**
 * The last `count` calendar months as `YYYY-MM`, oldest first, the current
 * month (Brussels time) last — and a `since` date safely before the first
 * one (a day early, so no timezone shift can drop a row; rows outside the
 * list are ignored by the caller).
 */
export function lastMonths(
  now: Date,
  count = GROWTH_MONTHS,
): { months: string[]; since: Date } {
  const [year, month] = localMoment(now, PLATFORM_TIMEZONE)
    .date.split('-')
    .map(Number);
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const since = new Date(Date.UTC(year, month - count, 1) - 86_400_000);
  return { months, since };
}
