import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PHONE_REGEX } from '../../clients/dto/create-client.dto';

/**
 * `PATCH /api/subcontractors/:id` — a subcontractor must be editable (a
 * testing bug was that it was not). `is_active` is never here — only
 * `DELETE` may flip it.
 */
export class UpdateSubcontractorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  company_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trade?: string;

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
  vat_number?: string;

  @ApiPropertyOptional({ description: 'Money is a string' })
  @IsOptional()
  @IsNumberString()
  hourly_rate?: string;
}
