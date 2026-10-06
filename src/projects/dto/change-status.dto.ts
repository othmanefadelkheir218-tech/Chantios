import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * `PATCH /api/projects/:id/status` — the only route that may change
 * `status`. Validated against the transition matrix in
 * `project-status.helper.ts`, never trusted as-is.
 */
export class ChangeStatusDto {
  @ApiProperty({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiPropertyOptional({ description: 'Stored on the history row' })
  @IsOptional()
  @IsString()
  reason?: string;
}
