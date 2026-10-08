import { Injectable } from '@nestjs/common';
import { MediaEntityType, PermissionScope } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../common/prisma/tenant-prisma.service';
import { BulkMediaIdsDto } from './dto/bulk-media-ids.dto';
import { FindMediaQueryDto } from './dto/find-media-query.dto';
import { RenameMediaDto } from './dto/rename-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { AttachMediaHandler } from './handlers/attach-media.handler';
import { DeleteMediaByEntityHandler } from './handlers/delete-media-by-entity.handler';
import { FindMediaHandler } from './handlers/find-media.handler';
import { HardDeleteMediaHandler } from './handlers/hard-delete-media.handler';
import { RenameMediaHandler } from './handlers/rename-media.handler';
import { ReplaceMediaHandler } from './handlers/replace-media.handler';
import { RestoreMediaHandler } from './handlers/restore-media.handler';
import { SoftDeleteMediaHandler } from './handlers/soft-delete-media.handler';
import { StorageUsageHandler } from './handlers/storage-usage.handler';
import { UploadMediaHandler } from './handlers/upload-media.handler';
import { toMediaEntity } from './helpers/media.helper';
import { MediaRepository } from './repositories/media.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class MediaService {
  constructor(
    private readonly uploadMedia: UploadMediaHandler,
    private readonly findMedia: FindMediaHandler,
    private readonly renameMedia: RenameMediaHandler,
    private readonly softDeleteMedia: SoftDeleteMediaHandler,
    private readonly hardDeleteMedia: HardDeleteMediaHandler,
    private readonly restoreMedia: RestoreMediaHandler,
    private readonly replaceMediaHandler: ReplaceMediaHandler,
    private readonly storageUsage: StorageUsageHandler,
    private readonly deleteMediaByEntity: DeleteMediaByEntityHandler,
    private readonly attachMedia: AttachMediaHandler,
    private readonly mediaRepository: MediaRepository,
  ) {}

  /**
   * `isLocked`: internal-only, never set from the HTTP body (see
   * `upload-media.handler.ts`) — step 15's `freeze-quote-pdf.handler`/
   * `freeze-invoice-pdf.handler` are today's only callers passing `true`.
   */
  upload(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    actor: AuthenticatedUser,
    isLocked = false,
  ) {
    return this.uploadMedia.execute(file, dto, actor, isLocked);
  }

  findAll(
    query: FindMediaQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    return this.findMedia.execute(query, actor, scope);
  }

  findOne(id: number, actor?: AuthenticatedUser, scope?: PermissionScope) {
    return this.findMedia.findOne(id, actor, scope);
  }

  rename(id: number, dto: RenameMediaDto, actor: AuthenticatedUser) {
    return this.renameMedia.execute(id, dto, actor);
  }

  softDelete(dto: BulkMediaIdsDto, actor: AuthenticatedUser) {
    return this.softDeleteMedia.execute(dto.ids, actor);
  }

  hardDelete(dto: BulkMediaIdsDto, actor: AuthenticatedUser) {
    return this.hardDeleteMedia.execute(dto.ids, actor);
  }

  restore(dto: BulkMediaIdsDto, actor: AuthenticatedUser) {
    return this.restoreMedia.execute(dto.ids, actor);
  }

  getStorageUsage() {
    return this.storageUsage.execute();
  }

  /**
   * Public entry point for single-image entities (`user` avatar, `tenant`
   * logo) — called by `users` (`POST /api/users/me/avatar`) and the tenant
   * logo route on this module, through this service, per the cross-module
   * rule.
   */
  replaceMedia(
    entityType: Extract<MediaEntityType, 'user' | 'tenant'>,
    entityId: number,
    file: Express.Multer.File,
    actor: AuthenticatedUser,
  ) {
    return this.replaceMediaHandler.execute(entityType, entityId, file, actor);
  }

  /**
   * The cascade cleanup entry point (doc/notes/media-files.md). Any module
   * removing a parent row must call this first — through this service,
   * never the repository. Today's only intended caller: step 04's
   * `prospect`-only project delete.
   */
  deleteAllForEntity(
    entityType: MediaEntityType,
    entityId: number,
    actor: AuthenticatedUser,
  ) {
    return this.deleteMediaByEntity.execute(entityType, entityId, actor);
  }

  /**
   * Links already-uploaded files (`entity_id = 0`, uploaded by this user) to
   * the entity that now exists — a chat message's attachments. `tx` — the
   * caller writes the entity and links its files in one transaction.
   */
  attachToEntity(
    mediaIds: number[],
    entityType: MediaEntityType,
    entityId: number,
    actor: AuthenticatedUser,
    tx?: TenantTransactionClient,
  ) {
    return this.attachMedia.execute(mediaIds, entityType, entityId, actor, tx);
  }

  /**
   * The (non-trashed) files of many entities at once, grouped by entity id —
   * one query for a whole page of chat messages, never one per message.
   */
  async findByEntityIds(entityType: MediaEntityType, entityIds: number[]) {
    const rows = await this.mediaRepository.findByEntityIds(
      entityType,
      entityIds,
    );
    const grouped = new Map<number, ReturnType<typeof toMediaEntity>[]>();
    for (const row of rows) {
      const list = grouped.get(row.entityId) ?? [];
      list.push(toMediaEntity(row));
      grouped.set(row.entityId, list);
    }
    return grouped;
  }
}
