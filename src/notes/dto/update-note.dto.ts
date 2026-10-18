import { PartialType } from '@nestjs/swagger';
import { CreateNoteDto } from './create-note.dto';

/** `PATCH /api/notes/:id` — every field optional. `label_ids` replaces the note's labels. */
export class UpdateNoteDto extends PartialType(CreateNoteDto) {}
