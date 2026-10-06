import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PHONE_REGEX } from '../../clients/dto/create-client.dto';

/**
 * `PATCH /api/suppliers/:id`. Every field optional. `is_active` is never
 * here — only `DELETE /api/suppliers/:id` (archive) may flip it.
 */
export class UpdateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vat_number?: string;
}
