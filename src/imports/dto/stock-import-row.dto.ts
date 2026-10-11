import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * One line of a stock file. No price (always the material's `purchase_price`),
 * no `project_id`, and never a consumption (doc/notes/bulk-import.md § Stock import).
 */
export class StockImportRowDto {
  @ApiProperty({
    description: 'The Excel line number, used in error messages',
    example: 2,
  })
  @IsInt()
  @Min(1)
  row: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Must match the material with this id',
    example: 'Peinture blanche',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ enum: ['purchase', 'adjustment'] })
  @IsIn(['purchase', 'adjustment'])
  type: 'purchase' | 'adjustment';

  @ApiProperty({ example: '25' })
  @IsNumberString()
  quantity: string;

  @ApiPropertyOptional({ example: '2026-10-10' })
  @IsOptional()
  @IsDateString()
  movement_date?: string;

  @ApiPropertyOptional({ description: 'Required on an adjustment' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
