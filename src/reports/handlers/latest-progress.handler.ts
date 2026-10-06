import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ProjectsService } from '../../projects/projects.service';
import { ReportRepository } from '../repositories/report.repository';

/**
 * `GET /api/projects/:id/progress` — the NEWEST report's `progress_pct`.
 * Progress is read, never stored: `projects` has no progress column. Step 12's
 * client portal calls this through `ReportsService`.
 *
 * A project with no report yet has `progress_pct: 0` and `report_date: null`.
 */
@Injectable()
export class LatestProgressHandler {
  constructor(
    @InjectPinoLogger(LatestProgressHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(projectId: number) {
    this.logger.debug(`Reading the progress of project ${projectId}`);
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(projectId);

    const latest = await this.reports.findLatestByProject(projectId);
    return {
      projectId,
      progressPct: latest?.progressPct ?? 0,
      reportDate: latest?.reportDate ?? null,
    };
  }
}
