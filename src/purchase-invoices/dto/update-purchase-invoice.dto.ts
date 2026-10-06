import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `PATCH /api/purchase-invoices/:id`. The source (`type`, contract,
 * supplier) is fixed at creation — a bill from someone else is a new bill.
 * `project_id: null` is allowed (a material bill carries none). The status
 * has its own route (`POST /:id/paid`).
 */
export class UpdatePurchaseInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cost_type_id?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  project_id?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  external_number?: string;

  @ApiPropertyOptional({ description: 'Money is a string' })
  @IsOptional()
  @IsNumberString()
  amount_excl_vat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  vat_rate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_reference?: string;
}
