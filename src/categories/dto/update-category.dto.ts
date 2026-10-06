import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * `PATCH /api/categories/:id` — admin only, own rows only. Never a
 * `NULL`-tenant default — `category.repository.ts#findOwnById` goes through
 * the tenant-scoped client on purpose, so a shared default simply does not
 * match and the handler turns that into a 404.
 */
export class UpdateCategoryDto {
  @ApiProperty({ example: 'Painting & decorating' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
