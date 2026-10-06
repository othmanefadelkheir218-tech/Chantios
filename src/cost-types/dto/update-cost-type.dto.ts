import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** `PATCH /api/cost-types/:id` — admin only, own rows only. */
export class UpdateCostTypeDto {
  @ApiProperty({ example: 'machine rental' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
