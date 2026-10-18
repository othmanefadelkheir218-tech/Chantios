import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';
import { noteAudit, trashCutoff } from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';
import { NoteAccessHandler } from './note-access.handler';

/**
 * Deletes notes for good, always with their images (ImageKit + `media`
 * first, then the note): one from the trash, the whole trash, or — the
 * daily cron — every note trashed more than 7 days ago.
 */
@Injectable()
export class DeleteNoteHandler {
  constructor(
    @InjectPinoLogger(DeleteNoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly access: NoteAccessHandler,
    private readonly media: MediaService,
    private readonly audit: AuditService,
  ) {}

  /** `DELETE /api/notes/:id/permanent` — only a note already in the trash. */
  async deleteOne(id: number, actor: AuthenticatedUser) {
    const note = await this.access.findOwn(id, actor.userId);
    if (!note.deletedAt) {
      this.logger.warn(`Note ${id} is not in the trash — not deleted`);
      throw new BadRequestException('Move the note to the trash first');
    }
    await this.remove(id, actor);
    return { deleted: [id] };
  }

  /** `DELETE /api/notes/trash` — every note in the caller's trash. */
  async emptyTrash(actor: AuthenticatedUser) {
    const ids = await this.notes.findTrashedIds(actor.userId);
    this.logger.info(
      `Emptying the trash of user ${actor.userId}: ${ids.length} note(s)`,
    );
    for (const id of ids) await this.remove(id, actor);
    return { deleted: ids };
  }

  /**
   * The daily purge, for the company in the tenant context (the cron runs
   * once per company). The actor of each delete is the note's owner.
   */
  async purgeExpired(
    tenantId: number,
    now: Date = new Date(),
  ): Promise<number> {
    const expired = await this.notes.findTrashedBefore(trashCutoff(now));
    for (const note of expired) {
      await this.remove(note.id, {
        tenantId,
        userId: note.userId,
        roleId: 0,
        email: null,
      });
    }
    if (expired.length > 0) {
      this.logger.info(
        `Tenant ${tenantId}: ${expired.length} expired note(s) deleted`,
      );
    }
    return expired.length;
  }

  private async remove(id: number, actor: AuthenticatedUser) {
    await this.media.deleteAllForEntity('note', id, actor);
    await this.notes.hardDelete(id);
    await this.audit.write(noteAudit(actor, 'delete', id));
    this.logger.info(`Note ${id} deleted for good`);
  }
}
