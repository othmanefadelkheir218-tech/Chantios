import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * `POST /api/cost-types` — admin only. Always carries the caller's own
 * `tenant_id`; a tenant can never create a shared (`tenant_id = NULL`)
 * default — only a seed script does that.
 */
export class CreateCostTypeDto {
  @ApiProperty({ example: 'insurance' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
