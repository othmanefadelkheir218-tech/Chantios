import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts at 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Search in name, last name and phone',
    example: 'othmane',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
