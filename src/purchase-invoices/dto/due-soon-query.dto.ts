import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** `GET /api/purchase-invoices/due-soon?days=7` */
export class DueSoonQueryDto {
  @ApiPropertyOptional({
    description: 'Bills due within this many days (overdue ones included)',
    default: 7,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  days: number = 7;
}
