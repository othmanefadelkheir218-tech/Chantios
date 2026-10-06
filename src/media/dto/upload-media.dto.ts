import { ApiProperty } from '@nestjs/swagger';
import { MediaEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';

/** The file itself comes through `FileInterceptor`/`@UploadedFile()`, not this DTO. */
export class UploadMediaDto {
  @ApiProperty({ enum: MediaEntityType })
  @IsEnum(MediaEntityType)
  entity_type: MediaEntityType;

  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  entity_id: number;
}
