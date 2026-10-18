import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NOTE_VIEWS } from '../helpers/note.helper';
import type { NoteView } from '../helpers/note.helper';

export class FindNotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NOTE_VIEWS, default: 'notes' })
  @IsOptional()
  @IsIn(NOTE_VIEWS)
  view: NoteView = 'notes';

  @ApiPropertyOptional({ description: 'Only notes with this label' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  label_id?: number;

  @ApiPropertyOptional({ description: 'Searches the title and the body' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
