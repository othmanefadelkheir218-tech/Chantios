import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseInvoiceType } from '@prisma/client';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsValidBillSource } from './source-pairing.validator';

/**
 * `POST /api/purchase-invoices` — both kinds, one endpoint.
 *
 * `type` answers WHO sent the paper; `cost_type_id` answers WHAT KIND of cost
 * it is (the margin reads that one). The source pairing is validated here
 * with a custom validator AND by the DB check. "Material bill with a
 * project" needs the cost type's name, so the handler checks it (and the
 * trigger backs it up). `amount_excl_vat >= 0` is checked in the handler
 * (`@Min` cannot be combined with `@IsNumberString`).
 */
export class CreatePurchaseInvoiceDto {
  @ApiProperty({ enum: ['subcontractor', 'supplier'], example: 'supplier' })
  @IsIn(['subcontractor', 'supplier'])
  @IsValidBillSource()
  type: PurchaseInvoiceType;

  @ApiProperty({ example: 2 })
  @IsInt()
  cost_type_id: number;

  @ApiPropertyOptional({ description: "Required when type = 'subcontractor'" })
  @IsOptional()
  @IsInt()
  subcontractor_contract_id?: number;

  @ApiPropertyOptional({ description: "Required when type = 'supplier'" })
  @IsOptional()
  @IsInt()
  supplier_id?: number;

  @ApiPropertyOptional({
    description:
      "Required when type = 'subcontractor'. Must be empty for a material bill",
  })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiPropertyOptional({ description: 'Their invoice number, as printed' })
  @IsOptional()
  @IsString()
  external_number?: string;

  @ApiProperty({ example: '1250.00', description: 'Money is a string' })
  @IsNumberString()
  amount_excl_vat: string;

  @ApiPropertyOptional({
    example: '21.00',
    description: "Defaults to the tenant's default VAT rate",
  })
  @IsOptional()
  @IsNumberString()
  vat_rate?: string;

  @ApiProperty({ example: '2026-10-06' })
  @IsDateString()
  issue_date: string;

  @ApiPropertyOptional({ example: '2026-11-05' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_reference?: string;
}
