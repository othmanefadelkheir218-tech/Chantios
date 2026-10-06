import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DATE_ONLY_REGEX } from './create-time-entry.dto';

/** `GET /api/time-entries?user_id=&project_id=&from=&to=` — `from`/`to` are inclusive work dates. */
export class FindTimeEntriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Ignored for roles with scope own — they only see their own',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: 'from must be a date like 2026-11-01' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @Matches(DATE_ONLY_REGEX, { message: 'to must be a date like 2026-11-30' })
  to?: string;
}
