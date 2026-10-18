import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { UpdateNoteDto } from '../dto/update-note.dto';
import {
  assertContentSize,
  cleanTitle,
  extractNoteText,
  noteAudit,
  resolvePinArchive,
} from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';
import { NoteAccessHandler } from './note-access.handler';

/**
 * `PATCH /api/notes/:id` — own note, not in the trash. `label_ids` replaces
 * the labels. The search text is rebuilt when the title or the body changes.
 */
@Injectable()
export class UpdateNoteHandler {
  constructor(
    @InjectPinoLogger(UpdateNoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly access: NoteAccessHandler,
    private readonly audit: AuditService,
  ) {}

  async execute(id: number, dto: UpdateNoteDto, actor: AuthenticatedUser) {
    this.logger.info(`Updating note ${id}`);
    const current = await this.access.findOwnEditable(id, actor.userId);
    assertContentSize(dto.content);
    const labelIds =
      dto.label_ids === undefined
        ? undefined
        : await this.access.assertOwnLabels(dto.label_ids, actor.userId);

    const title =
      dto.title === undefined ? current.title : cleanTitle(dto.title);
    const content = dto.content === undefined ? current.content : dto.content;
    const data: Prisma.NoteUncheckedUpdateInput = {
      ...resolvePinArchive(current, dto.is_pinned, dto.is_archived),
      ...(dto.color !== undefined && { color: dto.color }),
    };
    if (dto.title !== undefined || dto.content !== undefined) {
      data.title = title;
      data.content = (content as Prisma.InputJsonValue) ?? Prisma.JsonNull;
      data.contentText = extractNoteText(title, content);
    }

    const note = await this.notes.update(id, actor.tenantId, data, labelIds);
    await this.audit.write(noteAudit(actor, 'update', id));
    this.logger.info(`Note updated: ${id}`);
    return this.access.toEntity(note);
  }
}
