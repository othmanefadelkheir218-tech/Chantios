import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search in name and email',
    example: 'sara',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
