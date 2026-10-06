import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/** `PATCH /api/invoices/:id` — `draft` only. Never touches `client_id`/`project_id`/`quote_id`. */
export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: '2026-10-06' })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional({ example: '2026-11-05' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
