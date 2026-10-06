import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

/**
 * `PATCH /api/materials/:id`. A `purchase_price` change here only affects
 * *future* movements — every past `stock_movements` row already froze its
 * own `unit_price` at creation time, so nothing else to do here.
 */
export class UpdateMaterialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '6.50' })
  @IsOptional()
  @IsNumberString()
  purchase_price?: string;

  @ApiPropertyOptional({ example: '15' })
  @IsOptional()
  @IsNumberString()
  minimum_stock?: string;
}
