import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * `POST /api/admin/auth/verify-2fa` — `challenge_token` is the short-lived
 * token `admin-login.handler.ts` returned, naming which admin and which
 * `one_time_codes` challenge row this completes. `code` is the 6-digit TOTP
 * from the admin's authenticator app (otplib), not anything emailed.
 */
export class Verify2faDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  challenge_token: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  code: string;
}
