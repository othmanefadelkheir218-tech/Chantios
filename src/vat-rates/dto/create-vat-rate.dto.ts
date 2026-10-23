import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

/** Percent, 0 to 99.99, two decimals at most. A string, like every amount. */
export const VAT_RATE = /^\d{1,2}(\.\d{1,2})?$/;

export class CreateVatRateDto {
  @ApiProperty({ description: 'ISO 3166-1 alpha-2', example: 'BE' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country_code must be 2 letters (BE)' })
  country_code: string;

  @ApiProperty({ description: 'Percent, a string', example: '21.00' })
  @IsString()
  @Matches(VAT_RATE, { message: 'rate must be a percent between 0 and 99.99' })
  rate: string;

  @ApiPropertyOptional({
    description:
      'EU country: a company of this country with a TVA number pays 0 % (reverse charge)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_eu?: boolean;
}
