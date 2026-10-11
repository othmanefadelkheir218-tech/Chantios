import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';

/**
 * `POST /api/mobile/login` — `worker` role only. A PIN alone is not a
 * credential: it goes with an email or the 8-digit login code of a worker
 * added without email (auth-tokens.md § 2b).
 */
export class MobileLoginDto {
  @ApiProperty({
    example: '48213907',
    description: 'Email, or the 8-digit login code',
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: '1234', minLength: 4, maxLength: 6 })
  @IsNumberString()
  @Length(4, 6)
  pin: string;
}
