import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { QuoteLineDto } from './quote-line.dto';

/** `PUT /api/quotes/:id/lines` — replaces every line, `draft` only, one transaction. */
export class SetQuoteLinesDto {
  @ApiProperty({ type: [QuoteLineDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines: QuoteLineDto[];
}
