import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * `PATCH /api/quotes/:id` — `draft` only (`update-quote.handler`). Never
 * touches `client_id`/`project_id` (the acceptance chain ties the quote to
 * one project) or the lines/totals — only `PUT :id/lines` replaces those.
 */
export class UpdateQuoteDto {
  @ApiPropertyOptional({ example: '2026-10-06' })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional({ example: '2026-11-05' })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
