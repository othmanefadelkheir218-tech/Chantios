import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * `?tenant_id=` on the platform's support routes. This is a platform
 * (`/api/admin/...`) route, where naming a tenant is normal — and it is the
 * cross-check of the escape hatch: the ticket must belong to THAT tenant, or
 * the lookup finds nothing.
 */
export class AdminSupportQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: 1, description: 'The tenant that owns the ticket' })
  @Type(() => Number)
  @IsInt()
  tenant_id: number;
}

/** The same `tenant_id`, for the routes that carry no pagination (a POST). */
export class AdminSupportTenantQueryDto {
  @ApiProperty({ example: 1, description: 'The tenant that owns the ticket' })
  @Type(() => Number)
  @IsInt()
  tenant_id: number;
}
