import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';
import { toProjectEntity } from '../helpers/project.helper';
import { ProjectRepository } from '../repositories/project.repository';

/**
 * `DELETE /api/projects/:id` — hard delete, `prospect`-status only (any
 * other status -> 400). Calls `MediaService.deleteAllForEntity` first
 * (through the media **service**, never its repository, per the
 * cross-module rule) so every `media` row for this project is gone from
 * ImageKit + the database before the `projects` row itself is removed —
 * doc/notes/media-files.md § "Cascade cleanup".
 */
@Injectable()
export class DeleteProjectHandler {
  constructor(
    @InjectPinoLogger(DeleteProjectHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectRepository,
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, actor: AuthenticatedUser) {
    this.logger.info(`Deleting project ${id}`);

    const project = await this.projects.findById(id);
    if (!project) {
      this.logger.warn(`Cannot delete project: ${id} not found`);
      throw new NotFoundException('Project not found');
    }
    if (project.status !== 'prospect') {
      this.logger.warn(
        `Refused to delete project ${id}: status is ${project.status}, not prospect`,
      );
      throw new BadRequestException(
        'Only a project with status prospect can be deleted',
      );
    }

    await this.media.deleteAllForEntity('project', id, actor);
    await this.projects.delete(id);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'delete',
      entityType: 'project',
      entityId: id,
      oldValue: toProjectEntity(project),
      ipAddress: null,
    });
    this.logger.info(`Project deleted: ${id}`);
    return { id, deleted: true };
  }
}
