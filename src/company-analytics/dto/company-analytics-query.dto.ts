import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.validator';

/**
 * `GET /api/analytics/overview` — the period (doc/notes/analytics.md § The
 * period). Both empty → the last 12 months. At most 24 months.
 */
export class CompanyAnalyticsQueryDto {
  @ApiPropertyOptional({
    example: '2025-11-01',
    description:
      'First day, included. Default: the 1st of the month 11 months before `to`',
  })
  @IsOptional()
  @IsDateOnly()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-10-17',
    description: 'Last day, included. Default: today (company timezone)',
  })
  @IsOptional()
  @IsDateOnly()
  to?: string;
}
