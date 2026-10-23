import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlansService } from '../../plans/plans.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantVatHandler, toVatBlock } from './tenant-vat.handler';

/** `GET /api/billing/subscription` — own plan, limits and current period. */
@Injectable()
export class MySubscriptionHandler {
  constructor(
    @InjectPinoLogger(MySubscriptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly tenantVat: TenantVatHandler,
  ) {}

  async execute(tenantId: number) {
    this.logger.debug(`Fetching own subscription for tenant ${tenantId}`);
    const subscription = await this.subscriptions.findByTenant(tenantId);
    const plan = await this.plans.findOne(subscription.planId);
    const vat = await this.tenantVat.execute(tenantId);

    return {
      status: subscription.status,
      period_start: subscription.periodStart,
      period_end: subscription.periodEnd,
      pending_plan_id: subscription.pendingPlanId,
      pending_plan_effective_at: subscription.pendingPlanEffectiveAt,
      grace_ends_at: subscription.graceEndsAt,
      // Step 21: "Pay" or "Manage payment", and "Ends on <date>" after a cancel.
      has_card_subscription: !!subscription.stripeSubscriptionId,
      cancel_at_period_end: subscription.cancelAtPeriodEnd,
      // Step 27: the TVA on top of the HT prices; `missing` = cannot pay yet.
      vat: toVatBlock(vat),
      plan: {
        id: plan.id,
        name: plan.name,
        base_price: plan.basePrice.toString(),
        features: plan.features.map((f) => ({
          feature_key: f.featureKey,
          limit_value: f.limitValue,
          overage_rate: f.overageRate.toString(),
        })),
      },
    };
  }
}
