import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * `POST /api/portal/:token/messages` — the client writes. The sender is the
 * client of the token, never a body field.
 */
export class PortalMessageDto {
  @ApiProperty({ example: 'Can you come on Tuesday instead?', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
