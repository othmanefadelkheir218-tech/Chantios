import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumberString } from 'class-validator';

/** `GET /api/reports/:id/material-prefill?service_id=&quantity=` — a READ, nothing is saved. */
export class MaterialPrefillQueryDto {
  @ApiProperty({ example: 3, description: 'The service that was done' })
  @Type(() => Number)
  @IsInt()
  service_id: number;

  @ApiProperty({ example: '20', description: 'How much of it, e.g. 20 (m²)' })
  @IsNumberString()
  quantity: string;
}
