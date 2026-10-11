import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../../projects/projects.service';
import { TaskRepository } from '../repositories/task.repository';

/**
 * `GET /api/mobile/my-projects` — name + address of every project where the
 * caller has a task. The worker has no `projects` permission, so this is the
 * only way their task cards and hours form can show a project name
 * (doc/notes/planning-time-entries.md § The worker's projects).
 */
@Injectable()
export class MyProjectsHandler {
  constructor(
    @InjectPinoLogger(MyProjectsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(actor: AuthenticatedUser) {
    this.logger.debug(`Listing projects of user ${actor.userId}`);
    const ids = await this.tasks.findProjectIdsOfAssignee(actor.userId);
    return this.projects.findSummaries(ids);
  }
}
