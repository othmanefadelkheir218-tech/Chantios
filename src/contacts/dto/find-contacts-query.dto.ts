import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindContactsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search in name, email, phone and role (name or label)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
