import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * `GET /api/margins` — the `/margins` page. With no `status` it lists the
 * ACTIVE projects (`prospect` and `in_progress`); a closed project's numbers
 * are read from its frozen snapshot, but `?status=completed` (or `cancelled`)
 * lists their live view too.
 */
export class FindMarginsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
