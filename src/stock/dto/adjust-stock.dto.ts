import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `POST /api/stock/adjustment` — admin/manager only. Either sign, never
 * zero (checked in `record-adjustment.handler`). `note` is required: an
 * adjustment without a reason is unauditable. No `unit_price` field — an
 * adjustment always freezes from `materials.purchase_price` at that moment,
 * never a caller-supplied price.
 */
export class AdjustStockDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  material_id: number;

  @ApiProperty({
    description: 'Either sign, never 0, as a string',
    example: '-2',
  })
  @IsNumberString()
  quantity: string;

  @ApiProperty({ example: 'Breakage found during stock count' })
  @IsString()
  @IsNotEmpty()
  note: string;

  @ApiPropertyOptional({ description: 'FK -> projects.id, optional' })
  @IsOptional()
  @IsInt()
  project_id?: number;
}
