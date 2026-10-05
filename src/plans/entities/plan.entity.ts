import { ApiProperty } from '@nestjs/swagger';

export class PlanFeatureEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  plan_id: string;

  @ApiProperty({ example: 'max_workers' })
  feature_key: string;

  @ApiProperty({ example: 5 })
  limit_value: number;

  @ApiProperty({ description: 'A string', example: '2.00' })
  overage_rate: string;
}

export class PlanEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ description: 'A string', example: '50.00' })
  base_price: string;

  @ApiProperty({ description: 'false = closed to new signups' })
  is_active: boolean;

  @ApiProperty({ description: 'The plan a new signup lands on. Only one.' })
  is_default: boolean;

  @ApiProperty({
    description: 'The version this plan replaced',
    format: 'uuid',
    nullable: true,
  })
  parent_plan_id: string | null;

  @ApiProperty({ nullable: true })
  stripe_price_id: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ type: [PlanFeatureEntity] })
  features: PlanFeatureEntity[];
}
