import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaService } from '../../media/media.service';
import { ReportRepository } from '../repositories/report.repository';

/**
 * The photos of a project's site reports, newest first — media rows with
 * `entity_type = 'report'`, read through `MediaService` (never its repository).
 * Step 12's client portal shows them. Two queries for the whole project, not
 * one per report.
 */
@Injectable()
export class ProjectPhotosHandler {
  constructor(
    @InjectPinoLogger(ProjectPhotosHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly media: MediaService,
  ) {}

  async execute(projectId: number, limit: number) {
    const reportIds = await this.reports.findIdsByProject(projectId);
    this.logger.debug(
      `Reading the photos of ${reportIds.length} report(s) of project ${projectId}`,
    );
    const grouped = await this.media.findByEntityIds('report', reportIds);
    return [...grouped.values()]
      .flat()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}
