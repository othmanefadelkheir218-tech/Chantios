import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

/** A date only, no time part: `2026-11-03`. */
export const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `POST /api/time-entries` (and `/api/mobile/time-entries`). `hours` must be
 * `> 0` and `<= 24` — `@Min`/`@Max` cannot be combined with `@IsNumberString`
 * (money and quantities are strings), so the handler checks it; the daily
 * total across ALL projects is checked there too (`daily-hours.helper.ts`).
 * A second entry for the same user + project + day is an update, not an insert.
 */
export class CreateTimeEntryDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  project_id: number;

  @ApiPropertyOptional({
    example: 3,
    description:
      'A manager logging for someone else. Defaults to the caller. Ignored for roles with scope own',
  })
  @IsOptional()
  @IsInt()
  user_id?: number;

  @ApiPropertyOptional({
    description: 'Optional. If given, the task must belong to `project_id`',
  })
  @IsOptional()
  @IsInt()
  task_id?: number;

  @ApiProperty({ example: '2026-11-03', description: 'Date only, no time' })
  @Matches(DATE_ONLY_REGEX, {
    message: 'work_date must be a date like 2026-11-03',
  })
  work_date: string;

  @ApiProperty({ example: '8.00', description: '> 0 and <= 24' })
  @IsNumberString()
  hours: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
