import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** `PATCH /api/tasks/:id/status` — leaving `planned` needs at least one assignee (checked in the handler). */
export class SetTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.in_progress })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
