import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { MediaService } from '../../media/media.service';
import { UsersService } from '../../users/users.service';
import { FindContactsQueryDto } from '../dto/find-contacts-query.dto';
import { toContactEntity } from '../helpers/contact.helper';

/**
 * `GET /api/contacts` — every employee of the company as a card, inactive
 * included, active first then by name (doc/notes/contacts.md). Photos come
 * from the media module in one query.
 */
@Injectable()
export class ListContactsHandler {
  constructor(
    @InjectPinoLogger(ListContactsHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly media: MediaService,
  ) {}

  async execute({ page, limit, search }: FindContactsQueryDto) {
    this.logger.debug(`Listing contacts (page ${page}, limit ${limit})`);
    const [rows, total] = await this.users.findDirectory(
      search?.trim() || undefined,
      toSkip(page, limit),
      limit,
    );
    // A user has one avatar (replaced on upload); the newest wins.
    const avatars = await this.media.findByEntityIds(
      'user',
      rows.map((row) => row.id),
    );
    const data = rows.map((row) =>
      toContactEntity(row, avatars.get(row.id)?.at(-1)?.fileUrl ?? null),
    );
    return toPaginated(data, total, page, limit);
  }
}
