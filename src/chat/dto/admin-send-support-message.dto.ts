import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** `POST /api/admin/support/:ticketId/messages` — platform staff reply, text only. */
export class AdminSendSupportMessageDto {
  @ApiProperty({ example: 'We are looking into it.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
