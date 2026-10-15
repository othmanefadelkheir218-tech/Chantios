import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({
    description: 'The exact plan version the tenant is locked to',
  })
  plan_id: number;

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
    nullable: true,
  })
  pending_plan_id: number | null;

  @ApiProperty({ nullable: true })
  pending_plan_effective_at: Date | null;

  @ApiProperty({
    nullable: true,
    description: 'Only while past_due: the block date',
  })
  grace_ends_at: Date | null;

  @ApiProperty({
    description:
      'Card subscription cancelled: it ends at period_end, no refund',
  })
  cancel_at_period_end: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

/** A row of `GET /admin/subscriptions`: the subscription plus the names the list shows. */
export class SubscriptionListItemEntity extends SubscriptionEntity {
  @ApiProperty({ example: 'Rénovation Dupont' })
  tenant_name: string;

  @ApiProperty({ example: 'Pro' })
  plan_name: string;

  @ApiProperty({ nullable: true, example: 'Pro' })
  pending_plan_name: string | null;
}

export class UsageSnapshotEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

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
