import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * One line of a materials file. Types only — the frontend already checked
 * them, and the business checks (id, duplicates, unit) run in the job so the
 * user gets every error at once, line by line.
 */
export class MaterialImportRowDto {
  @ApiProperty({
    description: 'The Excel line number, used in error messages',
    example: 2,
  })
  @IsInt()
  @Min(1)
  row: number;

  @ApiPropertyOptional({ description: 'Empty = a new material', example: 12 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Peinture blanche' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 'L' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit: string;

  @ApiProperty({ example: '6.50' })
  @IsNumberString()
  purchase_price: string;

  @ApiProperty({ example: '10' })
  @IsNumberString()
  minimum_stock: string;

  @ApiPropertyOptional({
    description: 'New rows only: one "Stock initial" adjustment',
    example: '40',
  })
  @IsOptional()
  @IsNumberString()
  stock_depart?: string;
}
