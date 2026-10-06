import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

/**
 * `PUT /api/tasks/:id/assignees` — replaces the whole set. At least one.
 * Each id must be an active user of this tenant and appear once (checked in
 * the handler; `UNIQUE (task_id, user_id)` backs it up).
 */
export class SetAssigneesDto {
  @ApiProperty({ type: [Number], example: [3, 4] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  user_ids: number[];
}
