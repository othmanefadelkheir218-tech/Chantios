import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_IMPORT_ROWS } from './import-job.dto';
import { StockImportRowDto } from './stock-import-row.dto';

/** `POST /api/imports/stock` — the frontend read the `.xlsx` and sends its rows. */
export class CreateStockImportDto {
  @ApiProperty({ example: 'stock.xlsx' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({ type: [StockImportRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPORT_ROWS)
  @ValidateNested({ each: true })
  @Type(() => StockImportRowDto)
  rows: StockImportRowDto[];
}
