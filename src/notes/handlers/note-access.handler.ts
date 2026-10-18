import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaService } from '../../media/media.service';
import { NoteWithLabels, toNoteEntity } from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';

/**
 * The checks every note operation shares, written once: the note is the
 * caller's own (anyone else's answers `404`, the tenant admin's too), a
 * trashed note is read-only, the labels are the caller's own. And the one
 * way a note leaves the module, with its images.
 */
@Injectable()
export class NoteAccessHandler {
  constructor(
    @InjectPinoLogger(NoteAccessHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly media: MediaService,
  ) {}

  async findOwn(id: number, userId: number): Promise<NoteWithLabels> {
    const note = await this.notes.findOwn(id, userId);
    if (!note) {
      this.logger.warn(`Note ${id} not found for user ${userId}`);
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  /** The caller's note, not in the trash — to edit it. */
  async findOwnEditable(id: number, userId: number): Promise<NoteWithLabels> {
    const note = await this.findOwn(id, userId);
    if (note.deletedAt) {
      this.logger.warn(`Note ${id} is in the trash — read-only`);
      throw new BadRequestException(
        'This note is in the trash. Restore it first.',
      );
    }
    return note;
  }

  /** Every id must be one of the caller's labels. */
  async assertOwnLabels(labelIds: number[], userId: number): Promise<number[]> {
    const ids = [...new Set(labelIds)];
    const found = await this.notes.countOwnLabels(ids, userId);
    if (found !== ids.length) {
      this.logger.warn(
        `Unknown label in [${ids.join(', ')}] for user ${userId}`,
      );
      throw new BadRequestException('Unknown label');
    }
    return ids;
  }

  /** Notes as they leave the module, each with its images — one media query. */
  async toEntities(notes: NoteWithLabels[]) {
    const images = await this.media.findByEntityIds(
      'note',
      notes.map((note) => note.id),
    );
    return notes.map((note) => toNoteEntity(note, images.get(note.id) ?? []));
  }

  async toEntity(note: NoteWithLabels) {
    const [entity] = await this.toEntities([note]);
    return entity;
  }
}
