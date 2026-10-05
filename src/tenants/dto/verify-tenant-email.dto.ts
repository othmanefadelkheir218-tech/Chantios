import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, Length } from 'class-validator';

export class VerifyTenantEmailDto {
  @ApiProperty({ example: '482917', description: '6-digit code sent by email' })
  @IsNumberString()
  @Length(6, 6)
  code: string;
}
