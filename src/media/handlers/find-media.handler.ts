import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { RolesService } from '../../roles/roles.service';
import { FindMediaQueryDto } from '../dto/find-media-query.dto';
import {
  buildMediaFilter,
  NoteFileViewer,
  toMediaEntity,
  toVisibleMediaEntity,
  visibleMediaFilter,
} from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `GET /api/media` (list) and `GET /api/media/:id` (single). `scope = 'own'`
 * (the `worker` default on `media`) limits the list to the caller's own
 * uploads — doc/notes/Phaces/03-media.md. Note files show to their uploader
 * and to the tenant admin, file only (step 26 B, doc/notes/notes.md).
 */
@Injectable()
export class FindMediaHandler {
  constructor(
    @InjectPinoLogger(FindMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly roles: RolesService,
  ) {}

  async execute(
    { page, limit, entity_type, entity_id }: FindMediaQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.debug(`Listing media (page ${page}, limit ${limit})`);

    const uploadedBy = scope === 'own' ? actor.userId : undefined;
    const viewer = await this.noteFileViewer(actor);
    const [data, total] = await this.media.findMany(
      buildMediaFilter(entity_type, entity_id, uploadedBy, viewer),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toVisibleMediaEntity), total, page, limit);
  }

  /** Internal callers (PDF logo, portal): never a note file. */
  async findOne(id: number) {
    const media = await this.media.findById(id);
    if (!media) {
      this.logger.warn(`Media ${id} not found`);
      throw new NotFoundException('Media not found');
    }
    return toMediaEntity(media);
  }

  /**
   * `GET /api/media/:id`. With `scope = 'own'` a file uploaded by someone
   * else answers `404`, the same as an unknown id. A note file shows to its
   * uploader and the tenant admin, without its note id.
   */
  async findVisible(
    id: number,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    const media = await this.media.findVisibleById(
      id,
      visibleMediaFilter(await this.noteFileViewer(actor)),
    );
    if (!media || (scope === 'own' && media.uploadedBy !== actor.userId)) {
      this.logger.warn(`Media ${id} not found`);
      throw new NotFoundException('Media not found');
    }
    return toVisibleMediaEntity(media);
  }

  /** Notes are private: a platform admin who impersonates sees no note file. */
  private async noteFileViewer(
    actor: AuthenticatedUser,
  ): Promise<NoteFileViewer> {
    if (actor.impersonatedBy !== undefined) return null;
    const role = await this.roles.findRoleById(actor.roleId);
    return { userId: actor.userId, isAdmin: role?.name === 'admin' };
  }
}
