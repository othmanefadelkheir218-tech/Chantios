import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../notifications/notifications.service';
import { TimeEntriesService } from '../time-entries/time-entries.service';
import { STALLED_PROJECT_DAYS } from '../time-entries/helpers/stalled-project.helper';
import { TenantRunner } from './tenant-runner.service';

/**
 * Every morning, per company: an `in_progress` project with no hours logged
 * for `STALLED_PROJECT_DAYS` days (`stalled_project`, to the admin and
 * manager). The alert repeats at most once per window.
 */
@Injectable()
export class StalledProjectCron {
  constructor(
    @InjectPinoLogger(StalledProjectCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly timeEntries: TimeEntriesService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('30 8 * * *')
  async run(): Promise<{ alerts: number }> {
    let alerts = 0;
    try {
      await this.runner.forEachTenant('stalled-project', async (tenant) => {
        const projects = await this.timeEntries.findStalledProjects(
          STALLED_PROJECT_DAYS,
          tenant.id,
        );
        for (const project of projects) {
          await this.notifications.dispatch('stalled_project', {
            tenantId: tenant.id,
            dedupeDays: STALLED_PROJECT_DAYS,
            payload: {
              entity_id: project.projectId,
              project_id: project.projectId,
              project_name: project.projectName,
              days: STALLED_PROJECT_DAYS,
            },
          });
          alerts += 1;
        }
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Stalled-project cron failed');
    }
    this.logger.info(`Stalled-project cron: ${alerts} project(s)`);
    return { alerts };
  }
}
