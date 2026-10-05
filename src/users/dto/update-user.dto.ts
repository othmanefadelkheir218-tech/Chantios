import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

/** `PATCH /api/users/:id` — admin only. Every field is optional. */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+32 2 123 45 67' })
  @IsOptional()
  @Matches(/^\+?[0-9 ().-]{6,20}$/, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 7,
    description: 'See roles-permissions.md for the 7 fixed roles',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  role_id?: number;

  @ApiPropertyOptional({
    description: 'Money is a string, used for margin calculation',
    example: '18.50',
  })
  @IsOptional()
  @IsNumberString()
  hourly_rate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
