import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindMediaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MediaEntityType })
  @IsOptional()
  @IsEnum(MediaEntityType)
  entity_type?: MediaEntityType;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  entity_id?: number;
}
