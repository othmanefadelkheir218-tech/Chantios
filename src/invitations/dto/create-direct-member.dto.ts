import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/**
 * `POST /api/invitations/direct` — admin adds a member with no email sent
 * (doc/notes/auth-tokens.md § 2b). Two shapes, checked in
 * `direct-member.helper.ts`:
 * - `email` + temporary `password` (any role; `pin` too for a worker);
 * - no `email`: `worker` only, `pin` required, no password → login code.
 */
export class CreateDirectMemberDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    minimum: 1,
    maximum: 7,
    description: 'See roles-permissions.md for the 7 fixed roles',
  })
  @IsInt()
  @Min(1)
  @Max(7)
  role_id: number;

  @ApiPropertyOptional({
    example: 'jean@renovation-dupont.be',
    description: 'Leave out for a worker without email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    minLength: 12,
    description: 'Temporary password, required with an email',
  })
  @IsOptional()
  @IsString()
  @MinLength(12)
  password?: string;

  @ApiPropertyOptional({
    example: '1234',
    description: 'Worker only. Required without an email',
  })
  @IsOptional()
  @IsNumberString()
  @Length(4, 6)
  pin?: string;

  @ApiPropertyOptional({ example: '+32 470 12 34 56' })
  @IsOptional()
  @Matches(/^\+?[0-9 ().-]{6,20}$/, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional({ example: '18.50', description: 'Money is a string' })
  @IsOptional()
  @IsNumberString()
  hourly_rate?: string;
}
