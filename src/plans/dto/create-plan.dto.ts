import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

/** The only things a plan can put a number on (doc/notes/subscription-plans.md). */
export const FEATURE_KEYS = [
  'max_workers',
  'max_managers',
  'max_clients',
  'max_subcontractors',
  'storage_gb',
  'retention_days',
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;

export class PlanFeatureDto {
  @ApiProperty({ enum: FEATURE_KEYS })
  @IsIn(FEATURE_KEYS)
  feature_key: FeatureKey;

  @ApiProperty({ description: 'Included allowance', example: 5 })
  @IsInt()
  @Min(0)
  limit_value: number;

  @ApiPropertyOptional({
    description:
      'Price per extra unit, as a string. Ignored for `retention_days`.',
    example: '2.00',
    default: '0',
  })
  @IsOptional()
  @Matches(MONEY, { message: 'overage_rate is not a valid amount' })
  overage_rate?: string;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Monthly base price, as a string',
    example: '50.00',
  })
  @Matches(MONEY, { message: 'base_price is not a valid amount' })
  base_price: string;

  @ApiPropertyOptional({ description: 'Stripe Price id of this version' })
  @IsOptional()
  @IsString()
  stripe_price_id?: string;

  @ApiPropertyOptional({
    description: 'Make this the plan new signups land on',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({ type: [PlanFeatureDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features: PlanFeatureDto[];
}
