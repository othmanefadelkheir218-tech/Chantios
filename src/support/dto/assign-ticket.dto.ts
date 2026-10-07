import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/** `PATCH /api/admin/support/tickets/:id/assign` — platform admin only. */
export class AssignTicketDto {
  @ApiProperty({ description: 'admin_users.id to assign this ticket to' })
  @IsInt()
  assigned_admin_id: number;
}
