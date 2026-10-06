import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ProjectsService } from '../../projects/projects.service';
import { PortalTrackingRepository } from '../repositories/portal-tracking.repository';

const RECENT_EVENTS = 50;

/**
 * `GET /api/projects/:id/portal-tracking` — "the client opened it 3 times and
 * downloaded once", over every link the project ever had. The client's IP is
 * recorded but not shown.
 */
@Injectable()
export class FindTrackingHandler {
  constructor(
    @InjectPinoLogger(FindTrackingHandler.name)
    private readonly logger: PinoLogger,
    private readonly tracking: PortalTrackingRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(projectId: number) {
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(projectId);

    const [views, downloads, recent] = await Promise.all([
      this.tracking.countByType(projectId, 'view'),
      this.tracking.countByType(projectId, 'download'),
      this.tracking.findRecentByProject(projectId, RECENT_EVENTS),
    ]);
    this.logger.debug(
      `Project ${projectId}: ${views} view(s), ${downloads} download(s)`,
    );
    return {
      projectId,
      views,
      downloads,
      lastOpenedAt:
        recent.find((event) => event.eventType === 'view')?.createdAt ?? null,
      events: recent.map((event) => ({
        eventType: event.eventType,
        createdAt: event.createdAt,
      })),
    };
  }
}
