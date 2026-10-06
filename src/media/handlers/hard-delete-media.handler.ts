import { Injectable } from '@nestjs/common';
import { Media } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { imagekit } from '../../config/imagekit.config';
import { splitLocked, toMediaEntity } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `DELETE /api/media/permanent` — bulk, immediate, no trash. A row where
 * `is_locked = true` is skipped, same as soft delete. ImageKit is removed
 * **first**, then the row — a file whose ImageKit delete fails is left in
 * the database rather than becoming a broken link (doc/notes/media-files.md).
 */
@Injectable()
export class HardDeleteMediaHandler {
  constructor(
    @InjectPinoLogger(HardDeleteMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(ids: number[], actor: AuthenticatedUser) {
    const rows = await this.media.findManyByIds(ids);
    const { eligible, skipped } = splitLocked(rows);

    const { succeeded, failed } = await this.purgeFromImageKit(eligible);
    const succeededIds = succeeded.map((row) => row.id);

    this.logger.info(
      `Hard-deleting ${succeededIds.length} media row(s) (${skipped.length} locked skipped, ${failed.length} ImageKit failures)`,
    );
    const deleted = await this.media.hardDelete(succeededIds);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'hard_delete_many',
      entityType: 'media',
      entityId: null,
      newValue: {
        ids: succeededIds,
        skipped,
        failed: failed.map((row) => row.id),
      },
      ipAddress: null,
    });
    return {
      deleted: deleted.map(toMediaEntity),
      skipped,
    };
  }

  /** Deletes each row's file from ImageKit; a failure keeps that row out of `succeeded`. */
  private async purgeFromImageKit(
    rows: Media[],
  ): Promise<{ succeeded: Media[]; failed: Media[] }> {
    const succeeded: Media[] = [];
    const failed: Media[] = [];
    for (const row of rows) {
      try {
        await imagekit.files.delete(row.fileId);
        succeeded.push(row);
      } catch (err: unknown) {
        this.logger.error(
          { err, mediaId: row.id },
          `Failed to delete ImageKit file for media ${row.id} — row kept`,
        );
        failed.push(row);
      }
    }
    return { succeeded, failed };
  }
}
