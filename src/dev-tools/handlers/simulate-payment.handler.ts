import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { HandlePaymentFailedHandler } from '../../stripe/handlers/handle-payment-failed.handler';
import { HandlePaymentSucceededHandler } from '../../stripe/handlers/handle-payment-succeeded.handler';
import { PlansService } from '../../plans/plans.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SimulatedPaymentResult } from '../dto/simulate-payment.dto';

/**
 * Runs the REAL Stripe webhook handler with a fake `payment_intent` event, so
 * "the company paid" / "the payment failed" can be tested without Stripe.
 * A company with no Stripe customer gets a fake one (`cus_dev_<tenantId>`),
 * because the webhook handlers find the company by its Stripe customer.
 */
@Injectable()
export class SimulatePaymentHandler {
  constructor(
    @InjectPinoLogger(SimulatePaymentHandler.name)
    private readonly logger: PinoLogger,
    private readonly moduleRef: ModuleRef,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
  ) {}

  async execute(tenantId: number, result: SimulatedPaymentResult) {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      customerId = `cus_dev_${tenantId}`;
      await this.subscriptions.setStripeCustomerId(tenantId, customerId);
    }
    const plan = await this.plans.findOne(subscription.planId);
    const cents = Math.round(Number(plan.basePrice) * 100);

    this.logger.warn(
      `DEV TOOLS: simulating payment ${result} for tenant ${tenantId}`,
    );
    const event = {
      id: `evt_dev_${Date.now()}`,
      type: `payment_intent.${result === 'succeeded' ? 'succeeded' : 'payment_failed'}`,
      data: {
        object: { customer: customerId, amount: cents, amount_received: cents },
      },
    } as unknown as Stripe.Event;

    const handler =
      result === 'succeeded'
        ? this.moduleRef.get(HandlePaymentSucceededHandler, { strict: false })
        : this.moduleRef.get(HandlePaymentFailedHandler, { strict: false });
    await handler.execute(event);
    return this.subscriptions.findByTenant(tenantId);
  }
}
