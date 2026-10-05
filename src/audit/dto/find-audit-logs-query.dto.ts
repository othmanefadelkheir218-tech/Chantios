import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Only the entries about this company',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

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
