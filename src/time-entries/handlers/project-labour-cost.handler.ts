import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../../projects/projects.service';
import { TimeEntryRepository } from '../repositories/time-entry.repository';

/**
 * `GET /api/projects/:id/labour-cost` — `SUM(hours × hourly_rate)` using the
 * rate FROZEN on each row, never `users.hourly_rate`. Step 10 (margin) reads
 * the same number.
 */
@Injectable()
export class ProjectLabourCostHandler {
  constructor(
    @InjectPinoLogger(ProjectLabourCostHandler.name)
    private readonly logger: PinoLogger,
    private readonly entries: TimeEntryRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(projectId: number, actor: AuthenticatedUser) {
    this.logger.debug(`Computing labour cost of project ${projectId}`);
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(projectId);

    const row = await this.entries.sumLabourCostByProject(
      projectId,
      actor.tenantId,
    );
    return {
      projectId,
      labourCost: row.labourCost,
      totalHours: row.totalHours,
    };
  }
}
