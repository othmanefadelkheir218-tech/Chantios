import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { InvoiceLineDto } from './invoice-line.dto';

/**
 * `POST /api/invoices` — status always starts at `draft`, number taken
 * immediately. `due_date` left empty defaults to
 * `issue_date + tenants.default_payment_days` (client-invoices.md § "Why
 * due_date cannot be empty").
 */
export class CreateInvoiceDto {
  @ApiProperty({ example: 1, description: 'FK -> clients.id' })
  @IsInt()
  client_id: number;

  @ApiProperty({ example: 1, description: 'FK -> projects.id' })
  @IsInt()
  project_id: number;

  @ApiPropertyOptional({
    description: 'FK -> quotes.id — not every invoice needs one',
  })
  @IsOptional()
  @IsInt()
  quote_id?: number;

  @ApiPropertyOptional({ example: '2026-10-06' })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional({
    description: 'Defaults to issue_date + tenants.default_payment_days',
    example: '2026-11-05',
  })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ description: 'Payment terms, printed on the PDF' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}
