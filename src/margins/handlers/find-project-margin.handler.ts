import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toMarginEntity } from '../helpers/margin.helper';
import { MarginRepository } from '../repositories/margin.repository';

/**
 * `GET /api/projects/:id/margin` — one project's live margin. A project that
 * is not this tenant's has no row in the tenant-filtered read, so it is a
 * plain `404`.
 */
@Injectable()
export class FindProjectMarginHandler {
  constructor(
    @InjectPinoLogger(FindProjectMarginHandler.name)
    private readonly logger: PinoLogger,
    private readonly margins: MarginRepository,
  ) {}

  async execute(projectId: number) {
    const row = await this.margins.findByProject(projectId);
    if (!row) {
      this.logger.warn(`Margin: project ${projectId} not found`);
      throw new NotFoundException('Project not found');
    }
    return toMarginEntity(row);
  }
}
