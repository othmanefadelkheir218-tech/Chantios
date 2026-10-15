import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PlansService } from '../../plans/plans.service';
import { StripeService } from '../../stripe/stripe.service';
import { SetPendingPlanDto } from '../dto/set-pending-plan.dto';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class SetPendingPlanHandler {
  constructor(
    @InjectPinoLogger(SetPendingPlanHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlansService,
    // `StripeService` at run time (`strict: false`): `StripeModule` already
    // imports this module, a module import back would be a load cycle.
    private readonly moduleRef: ModuleRef,
  ) {}

  /**
   * Writes `pending_plan_id` and `pending_plan_effective_at` (the next
   * renewal). Never changes `plan_id` now: the current period is already paid.
   */
  async execute(tenantId: number, { plan_id }: SetPendingPlanDto) {
    this.logger.info(`Planning a plan change for tenant ${tenantId}`);

    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription) {
      this.logger.warn(
        `Cannot set pending plan: no subscription for ${tenantId}`,
      );
      throw new NotFoundException('Subscription not found for this tenant');
    }

    const plan = await this.plans.findOne(plan_id); // 404 when it does not exist
    if (!plan.isActive) {
      throw new BadRequestException('This plan is closed to new customers');
    }
    if (plan.id === subscription.planId) {
      throw new BadRequestException('The tenant is already on this plan');
    }

    // A company that pays by card (step 21, Q4): Stripe charges the new price
    // from the next invoice — the date this plan applies. Stripe first: if it
    // fails, nothing is planned. Webhooks then copy the new price.
    if (
      subscription.stripeSubscriptionId &&
      subscription.status !== 'cancelled'
    ) {
      if (!plan.stripePriceId) {
        throw new BadRequestException('This plan cannot be paid by card');
      }
      const stripe = this.moduleRef.get(StripeService, { strict: false });
      await stripe.updateSubscriptionPrice(
        subscription.stripeSubscriptionId,
        plan.stripePriceId,
      );
    }

    const updated = await this.subscriptions.setPendingPlan(
      tenantId,
      plan.id,
      subscription.periodEnd,
    );
    this.logger.info(
      `Tenant ${tenantId} moves to plan ${plan.id} at ${subscription.periodEnd.toISOString()}`,
    );
    return updated;
  }
}
