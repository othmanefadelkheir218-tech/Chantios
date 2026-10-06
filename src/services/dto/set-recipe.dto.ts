import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumberString,
  ValidateNested,
} from 'class-validator';

export class RecipeItemDto {
  @ApiProperty({ example: 1, description: 'FK -> materials.id' })
  @IsInt()
  material_id: number;

  @ApiProperty({
    description:
      'How much of this material one unit of the service consumes. Must be > 0.',
    example: '0.15',
  })
  @IsNumberString()
  quantity_per_unit: string;
}

/**
 * `PUT /api/services/:id/recipe` — replaces the whole recipe, one
 * transaction (`service.repository.ts#replaceRecipe`). An empty array is
 * valid: it clears the recipe entirely.
 */
export class SetRecipeDto {
  @ApiProperty({ type: [RecipeItemDto] })
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[];
}
