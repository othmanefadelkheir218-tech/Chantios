import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `POST /api/contracts`. `project_id` is REQUIRED — no contract without a
 * project. `amount_excl_vat` must not be negative: `@Min` cannot be combined
 * with `@IsNumberString` (money is a string), so the handler checks it.
 * "End not before start" is checked in the handler too.
 */
export class CreateContractDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  subcontractor_id: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  project_id: number;

  @ApiPropertyOptional({ example: 'Bathroom plumbing' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '4500.00', description: 'Money is a string' })
  @IsNumberString()
  amount_excl_vat: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-11-20' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
