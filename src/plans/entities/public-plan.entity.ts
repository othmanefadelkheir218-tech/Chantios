import { ApiProperty } from '@nestjs/swagger';

export class PublicPlanFeatureEntity {
  @ApiProperty({ example: 'max_workers' })
  feature_key: string;

  @ApiProperty({ example: 5 })
  limit_value: number;

  @ApiProperty({ description: 'A string', example: '2.00' })
  overage_rate: string;
}

/** A plan as the public pricing page sees it. No Stripe id, no parent plan, no subscriber count. */
export class PublicPlanEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Pro' })
  name: string;

  @ApiProperty({ description: 'A string', example: '50.00' })
  base_price: string;

  @ApiProperty({ description: 'The plan a new signup lands on' })
  is_default: boolean;

  @ApiProperty({ type: [PublicPlanFeatureEntity] })
  features: PublicPlanFeatureEntity[];
}
