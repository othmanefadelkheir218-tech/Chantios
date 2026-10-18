import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { CheckResetCodeDto } from './check-reset-code.dto';

/**
 * `email` is needed because `OneTimeCodesService` looks a code up by
 * (type, scope) before comparing hashes — the scope here is the user, which
 * the code alone can't resolve.
 */
export class ResetPasswordDto extends CheckResetCodeDto {
  @ApiProperty({ minLength: 12 })
  @IsString()
  @MinLength(12)
  password: string;
}
