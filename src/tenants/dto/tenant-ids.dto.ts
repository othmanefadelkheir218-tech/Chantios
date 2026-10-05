import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt } from 'class-validator';

/** Body of the two bulk routes: `DELETE /tenants` and `PATCH /tenants/restore`. */
export class TenantIdsDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @Type(() => Number)
  @IsInt({ each: true })
  @ArrayMinSize(1)
  ids: number[];
}
