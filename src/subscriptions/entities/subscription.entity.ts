import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  tenant_id: string;

  @ApiProperty({
    description: 'The exact plan version the tenant is locked to',
    format: 'uuid',
  })
  plan_id: string;

  @ApiProperty({ nullable: true })
  stripe_customer_id: string | null;

  @ApiProperty({ nullable: true })
  stripe_subscription_id: string | null;

  @ApiProperty({ nullable: true })
  stripe_price_id: string | null;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty()
  period_start: Date;

  @ApiProperty({ description: 'Next renewal' })
  period_end: Date;

  @ApiProperty({
    description: 'Plan applied at the next renewal',
    format: 'uuid',
    nullable: true,
  })
  pending_plan_id: string | null;

  @ApiProperty({ nullable: true })
  pending_plan_effective_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class UsageSnapshotEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  tenant_id: string;

  @ApiProperty()
  period_start: Date;

  @ApiProperty()
  period_end: Date;

  @ApiProperty()
  snapshot_taken_at: Date;

  @ApiProperty({ example: 'max_workers' })
  feature_key: string;

  @ApiProperty({ description: 'A string', example: '7.000' })
  actual_count: string;

  @ApiProperty({ example: 5 })
  included_allowance: number;

  @ApiProperty({ description: 'A string', example: '2.00' })
  overage_rate: string;

  @ApiProperty({ description: 'A string', example: '4.00' })
  overage_amount: string;

  @ApiProperty({ nullable: true })
  stripe_invoice_id: string | null;
}
