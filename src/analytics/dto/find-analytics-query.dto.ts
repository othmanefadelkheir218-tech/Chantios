import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAnalyticsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Only the events of this company',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @ApiPropertyOptional({ example: 'quote_sent' })
  @IsOptional()
  @IsString()
  event_name?: string;

  @ApiPropertyOptional({
    description: 'From this moment (ISO 8601)',
    example: '2026-10-01T00:00:00Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Until this moment (ISO 8601)',
    example: '2026-10-31T23:59:59Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
