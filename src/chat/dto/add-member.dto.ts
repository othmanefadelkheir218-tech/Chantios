import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

/** `POST /api/conversations/:id/members` — `internal` conversations only; an active user of this company. */
export class AddMemberDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  user_id: number;
}
