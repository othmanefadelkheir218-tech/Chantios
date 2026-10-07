import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../notifications/notifications.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { UsersService } from '../users/users.service';
import {
  isReminderHour,
  localMoment,
} from './helpers/tenant-local-time.helper';
import { TenantRunner } from './tenant-runner.service';

/**
 * Hourly. A company's reminder time (`end_of_day_reminder_time`, default
 * 18:00) is a wall-clock time in ITS timezone, so one daily run at a fixed
 * UTC hour would fire at the wrong local time. Instead this runs every hour
 * and, for each company, acts only when that company's local hour is its
 * reminder hour. Then every active `worker` with no hours logged today (local
 * date) gets `end_of_day_reminder`.
 */
@Injectable()
export class EndOfDayReminderCron {
  constructor(
    @InjectPinoLogger(EndOfDayReminderCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly users: UsersService,
    private readonly timeEntries: TimeEntriesService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 * * * *')
  async run(now: Date = new Date()): Promise<{ reminders: number }> {
    let reminders = 0;
    try {
      await this.runner.forEachTenant('end-of-day-reminder', async (tenant) => {
        if (
          !isReminderHour(now, tenant.timezone, tenant.endOfDayReminderTime)
        ) {
          return;
        }
        const today = localMoment(now, tenant.timezone).date;
        const logged = new Set(
          await this.timeEntries.findUserIdsWithHoursOn(
            new Date(`${today}T00:00:00Z`),
          ),
        );
        const workers = (await this.users.findActiveWithRole()).filter(
          (user) => user.roleName === 'worker' && !logged.has(user.id),
        );
        if (workers.length === 0) return;
        await this.notifications.dispatch('end_of_day_reminder', {
          tenantId: tenant.id,
          userIds: workers.map((worker) => worker.id),
          payload: { date: today },
        });
        reminders += workers.length;
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'End-of-day reminder cron failed');
    }
    this.logger.info(`End-of-day reminder cron: ${reminders} reminder(s)`);
    return { reminders };
  }
}
