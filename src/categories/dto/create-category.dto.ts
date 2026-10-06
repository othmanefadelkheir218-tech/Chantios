import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * `POST /api/categories` — admin only. Always carries the caller's own
 * `tenant_id` (the tenant extension injects it); a tenant can never create a
 * shared (`tenant_id = NULL`) default — only a seed script does that.
 */
export class CreateCategoryDto {
  @ApiProperty({ example: 'Painting' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
