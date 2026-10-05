import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePlanDto } from './create-plan.dto';

/**
 * Everything is optional: what you leave out is copied from the plan this
 * version replaces. A version never becomes the default on its own request —
 * it inherits the default flag from its parent.
 */
export class CreatePlanVersionDto extends PartialType(
  OmitType(CreatePlanDto, ['is_default'] as const),
) {}
