import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/** `unit`: matches `services.unit` free text in the schema, restricted here to the 4 known values. */
export const SERVICE_UNITS = ['m2', 'ml', 'h', 'piece'] as const;
export type ServiceUnit = (typeof SERVICE_UNITS)[number];

/**
 * `POST /api/services`. `default_vat_rate` left unset falls back to
 * `tenants.default_vat_rate` when the quote line pre-fills (step 06). For a
 * Belgian labour service, set `"6.00"` here.
 */
export class CreateServiceDto {
  @ApiProperty({ example: 1, description: 'FK -> categories.id' })
  @IsInt()
  category_id: number;

  @ApiProperty({ example: 'Painting (per m2)' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: SERVICE_UNITS, example: 'm2' })
  @IsIn(SERVICE_UNITS)
  unit: ServiceUnit;

  @ApiProperty({ description: 'Selling price, as a string', example: '12.00' })
  @IsNumberString()
  price_excl_vat: string;

  @ApiPropertyOptional({
    description:
      'NULL falls back to tenants.default_vat_rate. "6.00" for Belgian labour.',
    example: '21.00',
  })
  @IsOptional()
  @IsNumberString()
  default_vat_rate?: string;
}
