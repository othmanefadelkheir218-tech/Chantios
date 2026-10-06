import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { InvoiceLineDto } from './invoice-line.dto';

/** `PUT /api/invoices/:id/lines` — replaces every line, `draft` only, one transaction. */
export class SetInvoiceLinesDto {
  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}
