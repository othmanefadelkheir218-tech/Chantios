import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, Length } from 'class-validator';

/** `POST /api/users/:id/pin` — admin sets a worker's mobile PIN. */
export class SetPinDto {
  @ApiProperty({ example: '1234', minLength: 4, maxLength: 6 })
  @IsNumberString()
  @Length(4, 6)
  pin: string;
}
