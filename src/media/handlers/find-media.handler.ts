import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindMediaQueryDto } from '../dto/find-media-query.dto';
import { buildMediaFilter, toMediaEntity } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `GET /api/media` (list) and `GET /api/media/:id` (single). `scope = 'own'`
 * (the `worker` default on `media`) limits the list to the caller's own
 * uploads — doc/notes/Phaces/03-media.md.
 */
@Injectable()
export class FindMediaHandler {
  constructor(
    @InjectPinoLogger(FindMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
  ) {}

  async execute(
    { page, limit, entity_type, entity_id }: FindMediaQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    this.logger.debug(`Listing media (page ${page}, limit ${limit})`);

    const uploadedBy = scope === 'own' ? actor.userId : undefined;
    const [data, total] = await this.media.findMany(
      buildMediaFilter(entity_type, entity_id, uploadedBy),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toMediaEntity), total, page, limit);
  }

  async findOne(id: number) {
    const media = await this.media.findById(id);
    if (!media) {
      this.logger.warn(`Media ${id} not found`);
      throw new NotFoundException('Media not found');
    }
    return toMediaEntity(media);
  }
}
