import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/** `POST /api/auth/register` — a new company signs up. No company field on login afterwards: `users.email` is unique app-wide. */
export class RegisterTenantDto {
  @ApiProperty({ example: 'Rénovation Dupont' })
  @IsString()
  company_name: string;

  @ApiProperty({ example: 'contact@renovation-dupont.be' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  password: string;

  @ApiProperty({ description: "The admin's own name", example: 'Jean Dupont' })
  @IsString()
  name: string;

  @ApiProperty({
    description:
      'Company country, ISO 2 letters. Must be an active country of the TVA table (GET /api/vat-rates/countries), else 400.',
    example: 'BE',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be 2 letters (BE)' })
  country: string;

  @ApiPropertyOptional({ example: '+32 2 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'nl'], default: 'fr' })
  @IsOptional()
  @IsIn(['fr', 'en', 'nl'])
  locale?: string;
}
