import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindSubcontractorsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search in company name, email and phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Exact trade, e.g. plumbing' })
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiPropertyOptional({
    description: 'Filter archived (false) vs active (true) subcontractors',
  })
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
