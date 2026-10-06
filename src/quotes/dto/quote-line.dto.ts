import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * One `quote_lines` row. `service_id` nullable on purpose: a catalogue line
 * reserves stock through the recipe at acceptance, a free-text line reserves
 * nothing (doc/notes/entity-fields.md). `vat_rate` is required — pre-filled
 * client-side from the service or the tenant default
 * (`doc/notes/Phaces/06-quotes-invoices.md`); the backend validates its
 * format only, same as `quantity` / `unit_price_excl_vat`, consistent with
 * every other `Decimal`-backed DTO field in this codebase (`@IsNumberString`
 * cannot be combined with `@Min`/`@Max` in this `class-validator` version —
 * see `services/helpers/service.helper.ts#assertPositiveQuantity`). The
 * positive/non-zero bound is enforced in the handler.
 */
export class QuoteLineDto {
  @ApiPropertyOptional({
    description: 'FK -> services.id. Omitted/null = free-text line',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  service_id?: number;

  @ApiProperty({ example: 'Painting — living room' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'm2' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Must not be zero', example: '10.000' })
  @IsNumberString()
  quantity: string;

  @ApiProperty({ example: '12.00' })
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
