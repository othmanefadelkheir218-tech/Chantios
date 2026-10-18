import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NOTE_COLORS } from '../helpers/note.helper';

/** `POST /api/notes`. The owner is the caller, never a body field. */
export class CreateNoteDto {
  @ApiPropertyOptional({ example: 'Matériel à commander' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  /** The editor document (Tiptap JSON). Max 200 KB, checked in the handler. */
  @ApiPropertyOptional({
    example: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Vis 4x40' }] },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: NOTE_COLORS, default: 'default' })
  @IsOptional()
  @IsIn(NOTE_COLORS)
  color?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_archived?: boolean;

  /** The caller's own labels only. */
  @ApiPropertyOptional({ type: [Number], example: [1] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  label_ids?: number[];
}
