import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toBreakdownEntity } from '../helpers/margin.helper';
import { MarginRepository } from '../repositories/margin.repository';

/**
 * `GET /api/projects/:id/margin/breakdown` — the cost grouped by
 * `cost_type_id`. A cost type a tenant adds later gets its own line with no
 * code change: the grouping is by id, never a fixed list of columns.
 */
@Injectable()
export class MarginBreakdownHandler {
  constructor(
    @InjectPinoLogger(MarginBreakdownHandler.name)
    private readonly logger: PinoLogger,
    private readonly margins: MarginRepository,
  ) {}

  async execute(projectId: number) {
    const project = await this.margins.findByProject(projectId);
    if (!project) {
      this.logger.warn(`Breakdown: project ${projectId} not found`);
      throw new NotFoundException('Project not found');
    }
    const rows = await this.margins.findBreakdownByProject(projectId);
    return { projectId, ...toBreakdownEntity(rows) };
  }
}
