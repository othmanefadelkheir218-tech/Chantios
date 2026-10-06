import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumberString,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class DeclaredMaterialItemDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  material_id: number;

  @ApiProperty({
    example: '3.5',
    description:
      'POSITIVE — the amount used. The handler makes it negative in the ledger',
  })
  @IsNumberString()
  quantity: string;
}

/**
 * `POST /api/reports/:id/materials` — the only way stock leaves. Each
 * `quantity` must be `> 0` (checked in the stock module's own helper:
 * `@Min` cannot be combined with `@IsNumberString`). The whole declaration is
 * one transaction.
 */
export class DeclareMaterialsDto {
  @ApiPropertyOptional({
    description: 'Which service was done — kept in the audit trail only',
  })
  @IsOptional()
  @IsInt()
  service_id?: number;

  @ApiProperty({ type: [DeclaredMaterialItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeclaredMaterialItemDto)
  items: DeclaredMaterialItemDto[];
}
