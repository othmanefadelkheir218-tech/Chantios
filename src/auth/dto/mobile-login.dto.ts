import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumberString, Length } from 'class-validator';

/** `POST /api/mobile/login` — `worker` role only. A PIN alone is not a credential. */
export class MobileLoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234', minLength: 4, maxLength: 6 })
  @IsNumberString()
  @Length(4, 6)
  pin: string;
}
