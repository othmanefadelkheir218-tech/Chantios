import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Only the entries about this company',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tenant_id?: number;

  @ApiPropertyOptional({
    description: 'Only this kind of record',
    example: 'tenant',
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'Only this action',
    example: 'set_status',
  })
  @IsOptional()
  @IsString()
  action?: string;
}
