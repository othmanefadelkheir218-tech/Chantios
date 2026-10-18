import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { FindNotesQueryDto } from '../dto/find-notes-query.dto';
import { buildNoteFilter } from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';
import { NoteAccessHandler } from './note-access.handler';

/**
 * `GET /api/notes` (one view: notes / archive / trash) and `GET /api/notes/:id`.
 * Always the caller's own notes — the role's scope does not widen it.
 */
@Injectable()
export class FindNotesHandler {
  constructor(
    @InjectPinoLogger(FindNotesHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly access: NoteAccessHandler,
  ) {}

  async execute(query: FindNotesQueryDto, actor: AuthenticatedUser) {
    const { page, limit, view, label_id, search } = query;
    this.logger.debug(`Listing ${view} of user ${actor.userId} (page ${page})`);
    const [rows, total] = await this.notes.findMany(
      buildNoteFilter(actor.userId, view, label_id, search),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(await this.access.toEntities(rows), total, page, limit);
  }

  async findOne(id: number, actor: AuthenticatedUser) {
    const note = await this.access.findOwn(id, actor.userId);
    return this.access.toEntity(note);
  }
}
