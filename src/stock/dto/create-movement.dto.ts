import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `POST /api/stock/purchase`. Deliberately has **no** `project_id` field —
 * stock is a shared pool, a purchase belongs to no project. The global
 * `ValidationPipe` is `whitelist + forbidNonWhitelisted`, so a `project_id`
 * sent in the body is rejected outright, never silently dropped (same
 * pattern as step 04's `status` on the generic project `PATCH`).
 *
 * `quantity` must be positive — enforced in `record-purchase.handler`
 * (`@Min` cannot be combined with `@IsNumberString`, see
 * `materials/dto/create-material.dto.ts`).
 */
export class CreateMovementDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  material_id: number;

  @ApiProperty({ description: 'Positive, as a string', example: '100' })
  @IsNumberString()
  quantity: string;

  @ApiPropertyOptional({
    description:
      'Defaults to materials.purchase_price if omitted — frozen either way',
    example: '6.00',
  })
  @IsOptional()
  @IsNumberString()
  unit_price?: string;

  @ApiPropertyOptional({ example: '2026-10-06' })
  @IsOptional()
  @IsDateString()
  movement_date?: string;

  @ApiPropertyOptional({ description: 'FK -> purchase_invoices.id' })
  @IsOptional()
  @IsInt()
  purchase_invoice_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
