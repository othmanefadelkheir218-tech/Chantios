import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CreateNoteDto } from '../dto/create-note.dto';
import {
  assertContentSize,
  cleanTitle,
  extractNoteText,
  noteAudit,
  resolvePinArchive,
} from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';
import { NoteAccessHandler } from './note-access.handler';

/** `POST /api/notes` — the owner is the caller. The search text is built here. */
@Injectable()
export class CreateNoteHandler {
  constructor(
    @InjectPinoLogger(CreateNoteHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly access: NoteAccessHandler,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateNoteDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating a note for user ${actor.userId}`);
    assertContentSize(dto.content);
    const labelIds = await this.access.assertOwnLabels(
      dto.label_ids ?? [],
      actor.userId,
    );

    const title = cleanTitle(dto.title);
    const note = await this.notes.create(
      {
        tenantId: actor.tenantId,
        userId: actor.userId,
        title,
        content: (dto.content as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        contentText: extractNoteText(title, dto.content),
        color: dto.color ?? 'default',
        ...resolvePinArchive(
          { isPinned: false, isArchived: false },
          dto.is_pinned,
          dto.is_archived,
        ),
      },
      labelIds,
    );

    await this.audit.write(noteAudit(actor, 'create', note.id));
    this.logger.info(`Note created: ${note.id}`);
    return this.access.toEntity(note);
  }
}
