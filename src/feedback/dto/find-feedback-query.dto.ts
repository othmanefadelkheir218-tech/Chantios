import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FeedbackStatus, FeedbackType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindFeedbackQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FeedbackStatus })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @ApiPropertyOptional({ enum: FeedbackType })
  @IsOptional()
  @IsEnum(FeedbackType)
  type?: FeedbackType;

  @ApiPropertyOptional({
    description: 'Only the feedback of this company',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tenant_id?: number;
}
