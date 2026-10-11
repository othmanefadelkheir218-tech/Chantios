import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** `GET /api/admin/billing/snapshots` — every tenant, or one with `tenant_id`. */
export class FindSnapshotsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Only the snapshots of this tenant. Left out = every tenant.',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  tenant_id?: number;
}
