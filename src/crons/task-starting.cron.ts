import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../notifications/notifications.service';
import { taskAlertContext } from '../tasks/helpers/task-alert.helper';
import { TasksService } from '../tasks/tasks.service';
import { addDays, localMoment } from './helpers/tenant-local-time.helper';
import { TenantRunner } from './tenant-runner.service';

/**
 * Every afternoon, per company: each planned task that starts TOMORROW (the
 * company's own tomorrow, from its timezone) tells its assignees
 * (`task_starting`). Once per task.
 */
@Injectable()
export class TaskStartingCron {
  constructor(
    @InjectPinoLogger(TaskStartingCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly tasks: TasksService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 15 * * *')
  async run(): Promise<{ alerts: number }> {
    let alerts = 0;
    try {
      await this.runner.forEachTenant('task-starting', async (tenant) => {
        const today = localMoment(new Date(), tenant.timezone).date;
        const tomorrow = addDays(today, 1);
        const starting = await this.tasks.findStartingOn(
          new Date(`${tomorrow}T00:00:00Z`),
        );
        for (const task of starting) {
          const assigneeIds = task.assignees.map((a) => a.userId);
          if (assigneeIds.length === 0) continue;
          await this.notifications.dispatch('task_starting', {
            ...taskAlertContext(
              tenant.id,
              task,
              task.project.name,
              assigneeIds,
              { start_date: tomorrow },
            ),
            dedupeDays: 2,
          });
          alerts += 1;
        }
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Task-starting cron failed');
    }
    this.logger.info(`Task-starting cron: ${alerts} task(s)`);
    return { alerts };
  }
}
