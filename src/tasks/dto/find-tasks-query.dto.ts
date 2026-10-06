import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * `GET /api/tasks?project_id=&status=&from=&to=` — the Gantt feed. `from` /
 * `to` select every task whose date range OVERLAPS that window.
 */
export class FindTasksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
