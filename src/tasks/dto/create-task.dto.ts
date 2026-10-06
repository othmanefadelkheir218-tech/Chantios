import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `POST /api/tasks`. "End not before start" and "assignees are active users
 * of this tenant" are checked in the handler (business rules); the DB
 * `chk_task_dates` backs the dates up.
 */
export class CreateTaskDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  project_id: number;

  @ApiProperty({ example: 'Demolition of the old bathroom' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ['meeting', 'work'], example: 'work' })
  @IsIn(['meeting', 'work'])
  type: TaskType;

  @ApiProperty({ example: '2026-11-02' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2026-11-06' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [3, 4, 5],
    description: 'One `tasks` row, one `task_assignees` row per user',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  assignee_ids?: number[];
}
