import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaEntityType } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';
import { PENDING_ENTITY_ID } from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * Links already-uploaded files to the entity that did not exist yet when they
 * were uploaded — a chat message's attachments (doc/notes/Phaces/11-chat.md).
 * The client uploads each file through `POST /api/media` with
 * `entity_type = 'message'` and `entity_id = 0` (`PENDING_ENTITY_ID`), then
 * names the media ids when it sends the message; this sets their `entity_id`
 * to the new message.
 *
 * A file may be attached only if it is of the right type, still pending,
 * uploaded by this same user, and not in the trash — so one user can never
 * hang another user's file (or an already-attached one) on their message.
 * `tx` — the caller writes the message and links its files in ONE transaction,
 * so a bad id leaves no message behind. No audit row here: the file was already
 * audited when it was uploaded.
 */
@Injectable()
export class AttachMediaHandler {
  constructor(
    @InjectPinoLogger(AttachMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
  ) {}

  async execute(
    mediaIds: number[],
    entityType: MediaEntityType,
    entityId: number,
    actor: AuthenticatedUser,
    tx?: TenantTransactionClient,
  ): Promise<void> {
    if (mediaIds.length === 0) return;
    if (new Set(mediaIds).size !== mediaIds.length) {
      throw new BadRequestException('A file can only be attached once');
    }

    const rows = await this.media.findManyByIds(mediaIds);
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const id of mediaIds) {
      const row = byId.get(id);
      const attachable =
        row !== undefined &&
        row.entityType === entityType &&
        row.entityId === PENDING_ENTITY_ID &&
        row.uploadedBy === actor.userId &&
        row.deletedAt === null;
      if (!attachable) {
        this.logger.warn(
          `Cannot attach media ${id} to ${entityType} ${entityId}: not found, not pending, not yours, or in the trash`,
        );
        throw new BadRequestException(
          `File ${id} cannot be attached: upload it first with entity_type = ${entityType} and entity_id = 0, as yourself`,
        );
      }
    }

    await this.media.setEntityId(mediaIds, entityId, tx);
    this.logger.info(
      `${mediaIds.length} file(s) attached to ${entityType} ${entityId}`,
    );
  }
}
