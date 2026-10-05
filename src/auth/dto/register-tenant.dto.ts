import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
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

  @ApiPropertyOptional({ example: '+32 2 123 45 67' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['fr', 'en', 'ar'], default: 'fr' })
  @IsOptional()
  @IsIn(['fr', 'en', 'ar'])
  locale?: string;
}
