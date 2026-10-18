import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { noteAudit } from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';
import { NoteAccessHandler } from './note-access.handler';

/**
 * `DELETE /api/notes/:id` (to the trash) and `PATCH /api/notes/:id/restore`.
 * Doing it twice changes nothing and still answers `200`.
 */
@Injectable()
export class TrashNoteHandler {
  constructor(
    @InjectPinoLogger(TrashNoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly access: NoteAccessHandler,
    private readonly audit: AuditService,
  ) {}

  async trash(id: number, actor: AuthenticatedUser) {
    const current = await this.access.findOwn(id, actor.userId);
    if (current.deletedAt) return this.access.toEntity(current);

    this.logger.info(`Moving note ${id} to the trash`);
    const note = await this.notes.setDeletedAt(id, new Date());
    await this.audit.write(noteAudit(actor, 'trash', id));
    return this.access.toEntity(note);
  }

  async restore(id: number, actor: AuthenticatedUser) {
    const current = await this.access.findOwn(id, actor.userId);
    if (!current.deletedAt) return this.access.toEntity(current);

    this.logger.info(`Restoring note ${id} from the trash`);
    const note = await this.notes.setDeletedAt(id, null);
    await this.audit.write(noteAudit(actor, 'restore', id));
    return this.access.toEntity(note);
  }
}
