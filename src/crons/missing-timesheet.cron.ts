import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../notifications/notifications.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import {
  isReminderHour,
  localMoment,
} from './helpers/tenant-local-time.helper';
import { TenantRunner } from './tenant-runner.service';

/** The manager is told one hour AFTER the employees' own reminder. */
const HOURS_AFTER_REMINDER = 1;

/**
 * Hourly, same wall-clock rule as the end-of-day reminder: one hour after a
 * company's reminder time, every employee who has a task `in_progress` but no
 * hours logged today is reported to the admin and manager
 * (`missing_timesheet`). Once per employee per day.
 */
@Injectable()
export class MissingTimesheetCron {
  constructor(
    @InjectPinoLogger(MissingTimesheetCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly timeEntries: TimeEntriesService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 * * * *')
  async run(now: Date = new Date()): Promise<{ alerts: number }> {
    let alerts = 0;
    try {
      await this.runner.forEachTenant('missing-timesheet', async (tenant) => {
        if (
          !isReminderHour(
            now,
            tenant.timezone,
            tenant.endOfDayReminderTime,
            HOURS_AFTER_REMINDER,
          )
        ) {
          return;
        }
        const today = localMoment(now, tenant.timezone).date;
        const missing = await this.timeEntries.findMissingTimesheets(
          today,
          tenant.id,
        );
        for (const employee of missing) {
          await this.notifications.dispatch('missing_timesheet', {
            tenantId: tenant.id,
            dedupeDays: 1,
            payload: {
              entity_id: employee.userId,
              employee_id: employee.userId,
              employee_name: employee.userName,
              date: today,
            },
          });
          alerts += 1;
        }
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Missing-timesheet cron failed');
    }
    this.logger.info(`Missing-timesheet cron: ${alerts} employee(s)`);
    return { alerts };
  }
}
