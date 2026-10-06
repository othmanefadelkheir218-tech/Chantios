import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';

/**
 * `PATCH /api/time-entries/:id`. The employee, project and day are fixed —
 * a different day or project is a different entry. `task_id: null` clears
 * the task link.
 */
export class UpdateTimeEntryDto {
  @ApiPropertyOptional({ example: '7.50', description: '> 0 and <= 24' })
  @IsOptional()
  @IsNumberString()
  hours?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  task_id?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
