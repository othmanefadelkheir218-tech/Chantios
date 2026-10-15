import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DEV_TOOLS_ENABLED, env } from '../../config/env.config';
import { stripe } from '../../config/stripe.config';

/**
 * The company's account in Stripe (step 21). Throws if Stripe fails.
 *
 * With the dev tools on and a Stripe TEST key, the customer gets its own
 * Stripe test clock: Stripe moves time only for customers created on one,
 * so the owner can fast-forward the card subscription (trial end, monthly
 * charge, cancel at period end) from Dashboard → Billing → Test clocks.
 */
@Injectable()
export class CreateCustomerHandler {
  constructor(
    @InjectPinoLogger(CreateCustomerHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    tenantId: number,
    name: string,
    email: string,
  ): Promise<string> {
    try {
      const testClock = await this.testClockFor(tenantId, name);
      const customer = await stripe.customers.create(
        {
          name,
          email,
          metadata: { tenant_id: String(tenantId) },
          ...(testClock && { test_clock: testClock }),
        },
        {
          idempotencyKey: `customer:${tenantId}:${email}:${testClock ?? 'live'}`,
        },
      );
      this.logger.info(
        `Created Stripe customer ${customer.id} for tenant ${tenantId}`,
      );
      return customer.id;
    } catch (error) {
      this.logger.error(
        `Failed to create a Stripe customer for tenant ${tenantId}: ${String(error)}`,
      );
      throw new BadGatewayException('Failed to reach Stripe, try again');
    }
  }

  /** A new test clock, frozen at now — dev tools + test key only, else `null`. */
  private async testClockFor(
    tenantId: number,
    name: string,
  ): Promise<string | null> {
    if (!DEV_TOOLS_ENABLED || !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      return null;
    }
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
      name: `Tenant ${tenantId} — ${name}`.slice(0, 300),
    });
    this.logger.info(
      `Created Stripe test clock ${clock.id} for tenant ${tenantId}`,
    );
    return clock.id;
  }
}
