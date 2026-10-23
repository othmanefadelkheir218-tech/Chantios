import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { VAT_RATE } from './create-vat-rate.dto';

export class UpdateVatRateDto {
  @ApiPropertyOptional({
    description:
      'New percent. Applies from the next invoice: a new Stripe TaxRate is made, the old one archived.',
    example: '22.00',
  })
  @IsOptional()
  @IsString()
  @Matches(VAT_RATE, { message: 'rate must be a percent between 0 and 99.99' })
  rate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_eu?: boolean;

  @ApiPropertyOptional({
    description:
      'false = close the country (refused while a company of it pays by card). true = reopen.',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
