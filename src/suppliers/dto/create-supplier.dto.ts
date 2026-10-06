import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PHONE_REGEX } from '../../clients/dto/create-client.dto';

/** `POST /api/suppliers` — the directory of material suppliers. */
export class CreateSupplierDto {
  @ApiProperty({ example: 'Brico Matériaux SA' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'orders@brico.be' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+32 2 123 45 67' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'BE0123456789' })
  @IsOptional()
  @IsString()
  vat_number?: string;
}
