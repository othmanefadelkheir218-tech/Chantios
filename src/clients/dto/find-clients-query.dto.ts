import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindClientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search in name, email and phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter archived (false) vs active (true) clients',
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
