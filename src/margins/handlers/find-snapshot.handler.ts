import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toSnapshotEntity } from '../helpers/margin.helper';
import { ClosureSnapshotRepository } from '../repositories/closure-snapshot.repository';
import { MarginRepository } from '../repositories/margin.repository';

/**
 * `GET /api/projects/:id/snapshot` — the live (not voided) closure snapshot of
 * a project that was completed or cancelled. A project that is still running,
 * or was reopened and not closed again, has none: `404`.
 */
@Injectable()
export class FindSnapshotHandler {
  constructor(
    @InjectPinoLogger(FindSnapshotHandler.name)
    private readonly logger: PinoLogger,
    private readonly snapshots: ClosureSnapshotRepository,
    private readonly margins: MarginRepository,
  ) {}

  async execute(projectId: number) {
    const project = await this.margins.findByProject(projectId);
    if (!project) {
      this.logger.warn(`Snapshot: project ${projectId} not found`);
      throw new NotFoundException('Project not found');
    }
    const snapshot = await this.snapshots.findLiveByProject(projectId);
    if (!snapshot) {
      throw new NotFoundException('This project has no closure snapshot');
    }
    return toSnapshotEntity(snapshot);
  }
}
