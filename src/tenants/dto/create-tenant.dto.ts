import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Rénovation Dupont' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Main contact email. Unique across the whole app.',
    example: 'contact@renovation-dupont.be',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Registered name, if different' })
  @IsOptional()
  @IsString()
  legal_name?: string;

  @ApiPropertyOptional({
    description:
      'Company TVA number, printed on invoices. Country code then number (BE0123456789); spaces and dots are removed. Checked with VIES (step 27). null / "" clears it.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  vat_number?: string | null;

  @ApiPropertyOptional({ description: 'Company register number' })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiPropertyOptional({ example: '+32 2 123 45 67' })
  @IsOptional()
  @Matches(/^\+?[0-9 ().-]{6,20}$/, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description:
      'ISO 2-letter code. Required: an active country of the TVA table (GET /api/vat-rates/countries). It decides the TVA on the subscription.',
    example: 'BE',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be 2 letters (BE)' })
  country: string;

  @ApiPropertyOptional({
    description: 'VAT pre-fill for new document lines, as a string',
    default: '21.00',
  })
  @IsOptional()
  @Matches(/^\d{1,3}(\.\d{1,2})?$/, {
    message: 'default_vat_rate is not valid',
  })
  default_vat_rate?: string;

  @ApiPropertyOptional({
    description: 'Days a client gets to pay. Fills invoices.due_date',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  default_payment_days?: number;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'nl'], default: 'fr' })
  @IsOptional()
  @IsIn(['fr', 'en', 'nl'])
  locale?: string;

  @ApiPropertyOptional({ description: 'ISO code', default: 'EUR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ default: 'Europe/Brussels' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'When the hours reminder fires (HH:mm)',
    default: '18:00',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'end_of_day_reminder_time must be HH:mm',
  })
  end_of_day_reminder_time?: string;
}
