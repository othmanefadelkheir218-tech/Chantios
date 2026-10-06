import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType } from '@prisma/client';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `PATCH /api/tasks/:id`. The project is fixed at creation; the status has
 * its own route and the assignees theirs.
 */
export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ enum: ['meeting', 'work'] })
  @IsOptional()
  @IsIn(['meeting', 'work'])
  type?: TaskType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
