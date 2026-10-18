import { Injectable } from '@nestjs/common';
import { Media, MediaEntityType } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { imagekit } from '../../config/imagekit.config';
import { splitLocked, toMediaEntity } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `MediaService.deleteAllForEntity(entityType, entityId)` — the cascade
 * cleanup entry point (doc/notes/media-files.md § "Cascade cleanup").
 * Hard-deletes (ImageKit + row) every `media` row for one entity, trashed
 * rows included (the parent itself is gone — nothing left to keep a trashed
 * row for). `is_locked` rows are skipped, same rule as the bulk routes.
 * Callers: step 04's `prospect`-only project delete, and the notes module
 * (a note deleted for good, or one image removed — `mediaIds`).
 */
@Injectable()
export class DeleteMediaByEntityHandler {
  constructor(
    @InjectPinoLogger(DeleteMediaByEntityHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    entityType: MediaEntityType,
    entityId: number,
    actor: AuthenticatedUser,
    mediaIds?: number[],
  ) {
    const all = await this.media.findAllForEntity(entityType, entityId);
    const rows = mediaIds
      ? all.filter((row) => mediaIds.includes(row.id))
      : all;
    const { eligible, skipped } = splitLocked(rows);

    const succeeded: Media[] = [];
    for (const row of eligible) {
      try {
        await imagekit.files.delete(row.fileId);
        succeeded.push(row);
      } catch (err: unknown) {
        this.logger.error(
          { err, mediaId: row.id },
          `Failed to delete ImageKit file for media ${row.id} while cascading from ${entityType}:${entityId} — row kept`,
        );
      }
    }

    const succeededIds = succeeded.map((row) => row.id);
    this.logger.info(
      `Cascade delete ${entityType}:${entityId} — ${succeededIds.length} media row(s) removed (${skipped.length} locked skipped)`,
    );
    const deleted = await this.media.hardDelete(succeededIds);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'delete_all_for_entity',
      entityType: 'media',
      entityId: null,
      newValue: {
        entityType,
        entityId,
        ids: succeededIds,
        skipped,
      },
      ipAddress: null,
    });
    return {
      deleted: deleted.map(toMediaEntity),
      skipped,
    };
  }
}
