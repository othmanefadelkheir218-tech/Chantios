import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/** One `invoice_lines` row — same shape and rules as `quote-line.dto.ts`. */
export class InvoiceLineDto {
  @ApiPropertyOptional({
    description: 'FK -> services.id. Omitted/null = free-text line',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  service_id?: number;

  @ApiProperty({ example: 'Deposit — bathroom renovation' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'm2' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Must not be zero', example: '1' })
  @IsNumberString()
  quantity: string;

  @ApiProperty({ example: '3000.00' })
  @IsNumberString()
  unit_price_excl_vat: string;

  @ApiProperty({
    description: '6 or 21 — the rate for THIS line, not the whole document',
    example: '21.00',
  })
  @IsNumberString()
  vat_rate: string;

  @ApiProperty({ description: 'Display order', example: 0 })
  @IsInt()
  position: number;
}
