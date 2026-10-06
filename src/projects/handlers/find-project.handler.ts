import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  toProjectEntity,
  toProjectHistoryEntity,
} from '../helpers/project.helper';
import { ProjectStatusHistoryRepository } from '../repositories/project-status-history.repository';
import { ProjectRepository } from '../repositories/project.repository';

@Injectable()
export class FindProjectHandler {
  constructor(
    @InjectPinoLogger(FindProjectHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly statusHistory: ProjectStatusHistoryRepository,
  ) {}

  async execute(id: number) {
    const project = await this.projects.findById(id);
    if (!project) {
      this.logger.warn(`Project ${id} not found`);
      throw new NotFoundException('Project not found');
    }
    return toProjectEntity(project);
  }

  /** `GET /api/projects/:id/history` — every status change, newest first. */
  async history(id: number) {
    const project = await this.projects.findById(id);
    if (!project) {
      this.logger.warn(`Cannot read history: project ${id} not found`);
      throw new NotFoundException('Project not found');
    }
    const rows = await this.statusHistory.findByProject(id);
    return rows.map(toProjectHistoryEntity);
  }
}
