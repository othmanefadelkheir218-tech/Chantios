import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { SERVICE_UNITS } from './create-service.dto';
import type { ServiceUnit } from './create-service.dto';

/** `PATCH /api/services/:id`. The recipe is never touched here — only `PUT :id/recipe` replaces it. */
export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  category_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: SERVICE_UNITS })
  @IsOptional()
  @IsIn(SERVICE_UNITS)
  unit?: ServiceUnit;

  @ApiPropertyOptional({ example: '13.00' })
  @IsOptional()
  @IsNumberString()
  price_excl_vat?: string;

  @ApiPropertyOptional({ example: '21.00' })
  @IsOptional()
  @IsNumberString()
  default_vat_rate?: string;
}
