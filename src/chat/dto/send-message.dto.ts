import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * `POST /api/conversations/:id/messages`. `media_ids` are files already
 * uploaded through `POST /api/media` with `entity_type = 'message'` and
 * `entity_id = 0` (images + PDF only); sending the message links them.
 */
export class SendMessageDto {
  @ApiProperty({ example: 'The tiles arrive on Monday.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Pending files to attach',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  media_ids?: number[];
}
