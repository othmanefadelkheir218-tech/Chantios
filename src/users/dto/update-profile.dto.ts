import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

/** `PATCH /api/users/me` — a user's own name and phone only. */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jean Dupont' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+32 2 123 45 67' })
  @IsOptional()
  @Matches(/^\+?[0-9 ().-]{6,20}$/, { message: 'phone is not valid' })
  phone?: string;
}
