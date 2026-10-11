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
import { MaterialImportRowDto } from './material-import-row.dto';

/** `POST /api/imports/materials` — the frontend read the `.xlsx` and sends its rows. */
export class CreateMaterialsImportDto {
  @ApiProperty({ example: 'materiaux.xlsx' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({ type: [MaterialImportRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPORT_ROWS)
  @ValidateNested({ each: true })
  @Type(() => MaterialImportRowDto)
  rows: MaterialImportRowDto[];
}
