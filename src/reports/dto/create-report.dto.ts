import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * `POST /api/reports` — upsert on `(project_id, report_date)`: posting again
 * the same day for the same project EDITS that report, it never creates a
 * second one. `progress_pct` 0–100 (the DB `chk_progress_pct_range` backs it).
 */
export class CreateReportDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  project_id: number;

  @ApiPropertyOptional({
    example: '2026-11-03',
    description: 'Date only, no time. Defaults to today',
  })
  @IsOptional()
  @IsDateOnly()
  report_date?: string;

  @ApiProperty({ example: 40, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  progress_pct: number;

  @ApiPropertyOptional({ example: 'Sunny' })
  @IsOptional()
  @IsString()
  weather?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
