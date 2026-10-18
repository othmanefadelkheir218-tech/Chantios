import { ApiProperty } from '@nestjs/swagger';
import { MediaEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';
import { PUBLIC_MEDIA_ENTITY_TYPES } from '../helpers/media.helper';

/** The file itself comes through `FileInterceptor`/`@UploadedFile()`, not this DTO. */
export class UploadMediaDto {
  /** A note image goes through `POST /api/notes/:id/images`, never here. */
  @ApiProperty({ enum: PUBLIC_MEDIA_ENTITY_TYPES })
  @IsIn(PUBLIC_MEDIA_ENTITY_TYPES)
  entity_type: MediaEntityType;

  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  entity_id: number;
}
