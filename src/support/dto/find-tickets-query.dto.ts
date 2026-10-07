import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * `GET /api/admin/support/tickets?status=&priority=&tenant_id=` — the
 * PLATFORM side only. `tenant_id` must never be accepted on the tenant-facing
 * `GET /api/support/tickets`, which uses plain `PaginationQueryDto` instead.
 */
export class FindTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Only the tickets of this company' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  tenant_id?: number;
}
