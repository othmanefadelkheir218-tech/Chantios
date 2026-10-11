/** A moment as the wall clock of one timezone shows it. */
export interface LocalMoment {
  /** `YYYY-MM-DD` */
  date: string;
  hour: number;
  minute: number;
}

/**
 * What time is it, there? `Intl` knows the daylight-saving rules, so
 * `Europe/Brussels` is UTC+1 in winter and UTC+2 in summer without any table
 * of ours. An unknown timezone name falls back to UTC rather than crashing a
 * cron that walks every company.
 */
export function localMoment(now: Date, timeZone: string): LocalMoment {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    return localMoment(now, 'UTC');
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** The hour of a Postgres `time` column (Prisma hands it back as a 1970-01-01 UTC date). */
export function reminderHourOf(time: Date): number {
  return time.getUTCHours();
}

/**
 * Does the company's wall clock show its reminder hour right now? The crons
 * run hourly, so the minutes are ignored: `18:00` fires in the 18:xx run.
 * `offsetHours` moves the moment (the manager's missing-timesheet alert runs
 * one hour after the employees' reminder).
 */
export function isReminderHour(
  now: Date,
  timeZone: string,
  reminderTime: Date,
  offsetHours = 0,
): boolean {
  const target = (reminderHourOf(reminderTime) + offsetHours) % 24;
  return localMoment(now, timeZone).hour === target;
}

/** `YYYY-MM-DD` plus `days` (calendar arithmetic, no timezone involved). */
export function addDays(date: string, days: number): string {
  const moment = new Date(`${date}T00:00:00Z`);
  moment.setUTCDate(moment.getUTCDate() + days);
  return moment.toISOString().slice(0, 10);
}
