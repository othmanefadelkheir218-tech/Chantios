import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { imagekit } from '../../config/imagekit.config';
import { splitLocked } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

const TRASH_RETENTION_DAYS = 30;

/**
 * The daily purge job's business logic (doc/notes/media-files.md): hard-
 * deletes (ImageKit + row) any `media` row with `deleted_at` older than 30
 * days, across every tenant — this runs outside any request, so there is no
 * tenant in `nestjs-cls` to scope by (same reasoning as `findExpiredTrash`
 * in the repository).
 */
@Injectable()
export class PurgeExpiredMediaHandler {
  constructor(
    @InjectPinoLogger(PurgeExpiredMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
  ) {}

  async execute(): Promise<{ purged: number; skipped: number }> {
    const expired = await this.media.findExpiredTrash(TRASH_RETENTION_DAYS);
    const { eligible, skipped } = splitLocked(expired);

    const purgedIds: number[] = [];
    for (const row of eligible) {
      try {
        await imagekit.files.delete(row.fileId);
        purgedIds.push(row.id);
      } catch (err: unknown) {
        this.logger.error(
          { err, mediaId: row.id },
          `Failed to delete ImageKit file for trashed media ${row.id} — row kept`,
        );
      }
    }

    const purged =
      purgedIds.length > 0 ? await this.media.hardDeleteUnscoped(purgedIds) : 0;
    this.logger.info(
      `Purged ${purged} trashed media row(s) older than ${TRASH_RETENTION_DAYS} days (${skipped.length} locked skipped)`,
    );
    return { purged, skipped: skipped.length };
  }
}
