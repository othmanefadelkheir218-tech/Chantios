import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    description: 'Company VAT number, printed on invoices',
  })
  @IsOptional()
  @IsString()
  vat_number?: string;

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

  @ApiPropertyOptional({ description: 'ISO 2-letter code', example: 'BE' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

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

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'], default: 'fr' })
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
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
