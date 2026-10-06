import { ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseInvoiceStatus, PurchaseInvoiceType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** `GET /api/purchase-invoices?type=&status=&project_id=&cost_type_id=` */
export class FindPurchaseInvoicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PurchaseInvoiceType })
  @IsOptional()
  @IsEnum(PurchaseInvoiceType)
  type?: PurchaseInvoiceType;

  @ApiPropertyOptional({ enum: PurchaseInvoiceStatus })
  @IsOptional()
  @IsEnum(PurchaseInvoiceStatus)
  status?: PurchaseInvoiceStatus;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  cost_type_id?: number;
}
