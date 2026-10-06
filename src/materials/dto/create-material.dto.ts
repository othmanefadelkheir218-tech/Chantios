import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

/**
 * `POST /api/materials`. `purchase_price` / `minimum_stock` are validated as
 * numeric strings here (Prisma `Decimal` columns are passed as strings);
 * the "must not be negative" bound is enforced in `create-material.handler`
 * — `class-validator`'s `@Min` only accepts a `number`, so it cannot be
 * combined with `@IsNumberString` on the same field (0.15.1, checked).
 */
export class CreateMaterialDto {
  @ApiProperty({ example: 'Paint' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'L' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: "Today's price, as a string", example: '6.00' })
  @IsNumberString()
  purchase_price: string;

  @ApiProperty({
    description: 'Low-stock threshold, as a string',
    example: '10',
  })
  @IsNumberString()
  minimum_stock: string;
}
