import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** `POST /api/note-labels` and `PATCH /api/note-labels/:id`. Unique per user. */
export class NoteLabelDto {
  @ApiProperty({ example: 'Chantier' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
