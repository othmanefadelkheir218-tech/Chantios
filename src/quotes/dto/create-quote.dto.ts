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
import { QuoteLineDto } from './quote-line.dto';

/**
 * `POST /api/quotes` — status always starts at `draft`, number is taken
 * immediately (`document-counter.repository.ts`). An empty `lines` array is
 * valid: a quote can be built incrementally via `PUT :id/lines`.
 */
export class CreateQuoteDto {
  @ApiProperty({ example: 1, description: 'FK -> clients.id' })
  @IsInt()
  client_id: number;

  @ApiProperty({ example: 1, description: 'FK -> projects.id' })
  @IsInt()
  project_id: number;

  @ApiPropertyOptional({ example: '2026-10-06' })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional({
    description: 'Hard-blocks acceptance once passed',
    example: '2026-11-05',
  })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional({ description: 'Terms, printed on the PDF' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [QuoteLineDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines: QuoteLineDto[];
}
