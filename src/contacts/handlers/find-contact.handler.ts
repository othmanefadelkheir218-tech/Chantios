import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaService } from '../../media/media.service';
import { ProjectsService } from '../../projects/projects.service';
import { UsersService } from '../../users/users.service';
import { toContactEntity } from '../helpers/contact.helper';

/**
 * `GET /api/contacts/:id` — one employee and their open projects
 * (doc/notes/contacts.md). The projects show to everyone with `contacts`,
 * even without the `projects` view right: name and status only.
 */
@Injectable()
export class FindContactHandler {
  constructor(
    @InjectPinoLogger(FindContactHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly media: MediaService,
    private readonly projects: ProjectsService,
  ) {}

  async execute(id: number) {
    const row = await this.users.findDirectoryEntry(id);
    if (!row) {
      this.logger.warn(`Contact ${id} not found`);
      throw new NotFoundException('Contact not found');
    }
    const [avatars, projects] = await Promise.all([
      this.media.findByEntityIds('user', [id]),
      this.projects.findOpenForUser(id),
    ]);
    this.logger.debug(`Contact ${id}: ${projects.length} open projects`);
    return {
      ...toContactEntity(row, avatars.get(id)?.at(-1)?.fileUrl ?? null),
      projects,
    };
  }
}
