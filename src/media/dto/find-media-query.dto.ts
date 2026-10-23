import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { PUBLIC_MEDIA_ENTITY_TYPES } from '../helpers/media.helper';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** `note` can be listed (own note files, or all for the admin), never uploaded here. */
const LISTED_MEDIA_ENTITY_TYPES = [...PUBLIC_MEDIA_ENTITY_TYPES, 'note'];

export class FindMediaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LISTED_MEDIA_ENTITY_TYPES })
  @IsOptional()
  @IsIn(LISTED_MEDIA_ENTITY_TYPES)
  entity_type?: MediaEntityType;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  entity_id?: number;
}
