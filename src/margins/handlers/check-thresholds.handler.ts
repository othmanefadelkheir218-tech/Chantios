import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  costRatioPct,
  levelsReached,
} from '../helpers/margin-threshold.helper';
import { MarginAlertRepository } from '../repositories/margin-alert.repository';
import { MarginRepository } from '../repositories/margin.repository';

/**
 * The 80 % / 95 % alerts, each firing ONCE. Called AFTER every time entry,
 * consumption, purchase invoice and quote acceptance has been saved:
 *
 *   1. read the live margin; skip a project that is not `in_progress`
 *   2. work out the levels reached now (`levelsReached`, the one implementation)
 *   3. RESET: delete the `project_margin_alerts` rows of levels no longer
 *      reached — an extra accepted quote raised the budget and the project is
 *      healthy again, so those levels can fire again
 *   4. FIRE: for each reached level, write its row; only a call that really
 *      created the row sends the alert (the primary key is the dedup), so a
 *      project sitting at 83 % never mails on every save
 *
 * It must never fail the save that triggered it — the data is already
 * committed — so every error is logged and swallowed.
 */
@Injectable()
export class CheckThresholdsHandler {
  constructor(
    @InjectPinoLogger(CheckThresholdsHandler.name)
    private readonly logger: PinoLogger,
    private readonly margins: MarginRepository,
    private readonly alerts: MarginAlertRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(projectId: number, tenantId: number) {
    try {
      const margin = await this.margins.findByProject(projectId);
      if (!margin || margin.status !== 'in_progress') {
        return { reached: [], fired: [] };
      }

      const reached = levelsReached(margin.totalCost, margin.budgetExclVat);
      await this.alerts.deleteLevelsNotIn(projectId, reached);

      const fired = [];
      for (const level of reached) {
        const created = await this.alerts.createIfAbsent(
          projectId,
          level,
          tenantId,
        );
        if (!created) continue;
        fired.push(level);
        this.logger.warn(
          `Margin alert ${level.toUpperCase()}: project ${projectId} cost ${margin.totalCost.toString()} of budget ${margin.budgetExclVat.toString()}`,
        );
        await this.notifications.dispatch(
          level === 'critical' ? 'margin_critical' : 'margin_warning',
          {
            tenantId,
            payload: {
              entity_id: projectId,
              project_id: projectId,
              project_name: margin.name,
              cost_pct: costRatioPct(
                margin.totalCost,
                margin.budgetExclVat,
              )?.toFixed(0),
            },
          },
        );
      }
      return { reached, fired };
    } catch (err: unknown) {
      this.logger.error(
        { err },
        `Margin threshold check failed for project ${projectId}`,
      );
      return { reached: [], fired: [] };
    }
  }
}
