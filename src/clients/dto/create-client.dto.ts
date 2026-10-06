import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/** Same format the `clients.phone` CHECK constraint enforces. */
export const PHONE_REGEX = /^\+?[0-9 ().-]{6,20}$/;

/**
 * `POST /api/clients`. `vat_number` is required when `type = 'professional'`
 * — checked in `create-client.handler` (business rule), backed by the
 * `chk_professional_has_vat` DB constraint.
 */
export class CreateClientDto {
  @ApiPropertyOptional({ enum: ClientType, default: ClientType.individual })
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @ApiProperty({ example: 'Dubois SPRL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Marie Dubois' })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiProperty({ example: 'marie@dubois.be' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+32 2 123 45 67' })
  @Matches(PHONE_REGEX, { message: 'phone is not valid' })
  phone: string;

  @ApiPropertyOptional({ example: '+32 475 00 00 00' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone_secondary is not valid' })
  phone_secondary?: string;

  @ApiPropertyOptional({ description: "Required when type = 'professional'" })
  @IsOptional()
  @IsString()
  vat_number?: string;

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

  @ApiPropertyOptional({ example: 'BE' })
  @IsOptional()
  @Length(2, 2)
  country?: string;

  @ApiPropertyOptional({
    description: 'Internal only — never shown in the portal',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
