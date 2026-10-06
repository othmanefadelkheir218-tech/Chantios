import { Injectable } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindTimeEntriesQueryDto } from '../dto/find-time-entries-query.dto';
import {
  buildTimeEntryFilter,
  toTimeEntryEntity,
} from '../helpers/time-entry.helper';
import { TimeEntryRepository } from '../repositories/time-entry.repository';

/**
 * `GET /api/time-entries` and `GET /api/mobile/my-entries`. A caller with
 * scope `own` (the `worker` default) only ever sees their own rows —
 * `?user_id=` is ignored for them. `mineOnly` forces the same for
 * `my-entries`, whatever the role.
 */
@Injectable()
export class FindTimeEntriesHandler {
  constructor(
    @InjectPinoLogger(FindTimeEntriesHandler.name)
    private readonly logger: PinoLogger,
    private readonly entries: TimeEntryRepository,
  ) {}

  async execute(
    query: FindTimeEntriesQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
    mineOnly = false,
  ) {
    const { page, limit } = query;
    this.logger.debug(`Listing time entries (page ${page}, limit ${limit})`);

    const userId = scope === 'own' || mineOnly ? actor.userId : query.user_id;
    const [data, total] = await this.entries.findMany(
      buildTimeEntryFilter({
        userId,
        projectId: query.project_id,
        from: query.from,
        to: query.to,
      }),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toTimeEntryEntity), total, page, limit);
  }
}
