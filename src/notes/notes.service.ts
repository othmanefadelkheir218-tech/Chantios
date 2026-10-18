import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateNoteDto } from './dto/create-note.dto';
import { FindNotesQueryDto } from './dto/find-notes-query.dto';
import { NoteLabelDto } from './dto/note-label.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateNoteHandler } from './handlers/create-note.handler';
import { DeleteNoteHandler } from './handlers/delete-note.handler';
import { FindNotesHandler } from './handlers/find-notes.handler';
import { NoteImagesHandler } from './handlers/note-images.handler';
import { NoteLabelsHandler } from './handlers/note-labels.handler';
import { TrashNoteHandler } from './handlers/trash-note.handler';
import { UpdateNoteHandler } from './handlers/update-note.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class NotesService {
  constructor(
    private readonly findNotes: FindNotesHandler,
    private readonly createNote: CreateNoteHandler,
    private readonly updateNote: UpdateNoteHandler,
    private readonly trashNote: TrashNoteHandler,
    private readonly deleteNote: DeleteNoteHandler,
    private readonly noteImages: NoteImagesHandler,
    private readonly noteLabels: NoteLabelsHandler,
  ) {}

  findAll(query: FindNotesQueryDto, actor: AuthenticatedUser) {
    return this.findNotes.execute(query, actor);
  }

  findOne(id: number, actor: AuthenticatedUser) {
    return this.findNotes.findOne(id, actor);
  }

  create(dto: CreateNoteDto, actor: AuthenticatedUser) {
    return this.createNote.execute(dto, actor);
  }

  update(id: number, dto: UpdateNoteDto, actor: AuthenticatedUser) {
    return this.updateNote.execute(id, dto, actor);
  }

  trash(id: number, actor: AuthenticatedUser) {
    return this.trashNote.trash(id, actor);
  }

  restore(id: number, actor: AuthenticatedUser) {
    return this.trashNote.restore(id, actor);
  }

  deletePermanently(id: number, actor: AuthenticatedUser) {
    return this.deleteNote.deleteOne(id, actor);
  }

  emptyTrash(actor: AuthenticatedUser) {
    return this.deleteNote.emptyTrash(actor);
  }

  /** The daily cron — the company in the tenant context. */
  purgeExpiredTrash(tenantId: number, now?: Date) {
    return this.deleteNote.purgeExpired(tenantId, now);
  }

  addImage(id: number, file: Express.Multer.File, actor: AuthenticatedUser) {
    return this.noteImages.add(id, file, actor);
  }

  removeImage(id: number, mediaId: number, actor: AuthenticatedUser) {
    return this.noteImages.remove(id, mediaId, actor);
  }

  findLabels(actor: AuthenticatedUser) {
    return this.noteLabels.findAll(actor);
  }

  createLabel(dto: NoteLabelDto, actor: AuthenticatedUser) {
    return this.noteLabels.create(dto, actor);
  }

  renameLabel(id: number, dto: NoteLabelDto, actor: AuthenticatedUser) {
    return this.noteLabels.rename(id, dto, actor);
  }

  deleteLabel(id: number, actor: AuthenticatedUser) {
    return this.noteLabels.remove(id, actor);
  }
}
