import {
  addDays,
  localMoment,
} from '../../common/helpers/tenant-local-time.helper';

export interface DashboardDates {
  /** Today in the tenant's timezone, as a `@db.Date` value (UTC midnight). */
  today: Date;
  /** Monday of this week, same form. */
  weekStart: Date;
}

const toDbDate = (day: string) => new Date(`${day}T00:00:00.000Z`);

/** "Today" and "this week" (Monday → today) use the tenant's `timezone` (doc/notes/dashboard.md). */
export function dashboardDates(now: Date, timeZone: string): DashboardDates {
  const today = localMoment(now, timeZone).date;
  const weekday = toDbDate(today).getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (weekday + 6) % 7;
  return {
    today: toDbDate(today),
    weekStart: toDbDate(addDays(today, -daysSinceMonday)),
  };
}
