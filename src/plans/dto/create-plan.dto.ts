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
      '"0" means unlimited for this dimension, at no extra cost. Ignored for `retention_days` (always forced to "0").',
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

  @ApiPropertyOptional({
    description: 'Make this the plan new signups land on',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({
    type: [PlanFeatureDto],
    description:
      'Must contain exactly these 6 keys, no more, no fewer: ' +
      FEATURE_KEYS.join(', '),
    example: [
      { feature_key: 'max_workers', limit_value: 5, overage_rate: '2.00' },
      { feature_key: 'max_managers', limit_value: 3, overage_rate: '5.00' },
      { feature_key: 'max_clients', limit_value: 50, overage_rate: '0.20' },
      {
        feature_key: 'max_subcontractors',
        limit_value: 20,
        overage_rate: '0.20',
      },
      { feature_key: 'storage_gb', limit_value: 20, overage_rate: '0.50' },
      {
        feature_key: 'retention_days',
        limit_value: 365,
        overage_rate: '9.99',
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features: PlanFeatureDto[];
}
