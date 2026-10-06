import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PHONE_REGEX } from '../../clients/dto/create-client.dto';

/** `POST /api/subcontractors` — the directory entry, created once, reused on every project. */
export class CreateSubcontractorDto {
  @ApiProperty({ example: 'Plomberie Janssens SPRL' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiPropertyOptional({ example: 'plumbing' })
  @IsOptional()
  @IsString()
  trade?: string;

  @ApiPropertyOptional({ example: 'info@janssens.be' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+32 475 00 00 00' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional({ example: 'BE0123456789' })
  @IsOptional()
  @IsString()
  vat_number?: string;

  @ApiPropertyOptional({ example: '45.00', description: 'Money is a string' })
  @IsOptional()
  @IsNumberString()
  hourly_rate?: string;
}
