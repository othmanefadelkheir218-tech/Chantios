import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { env } from '../config/env.config';
import { stripe } from '../config/stripe.config';
import { ArchivePlanPriceHandler } from './handlers/archive-plan-price.handler';
import { CreatePlanPriceHandler } from './handlers/create-plan-price.handler';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly createPlanPriceHandler: CreatePlanPriceHandler,
    private readonly archivePlanPriceHandler: ArchivePlanPriceHandler,
  ) {}

  /** A new Stripe Product + Price for a plan. Throws if Stripe fails. */
  createPlanPrice(name: string, basePrice: string): Promise<string> {
    return this.createPlanPriceHandler.execute(name, basePrice);
  }

  /** Archives a plan's Stripe Price. Best-effort — never throws. */
  archivePlanPrice(stripePriceId: string | null): Promise<void> {
    return this.archivePlanPriceHandler.execute(stripePriceId);
  }

  /** Checks the Stripe signature. Throws 400 if the request is not from Stripe. */
  constructEvent(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Stripe.Event {
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing body or stripe-signature header');
    }
    try {
      return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }
  }

  /** Called for every valid event. Add a `case` here for each event we need. */
  handleEvent(event: Stripe.Event) {
    switch (event.type) {
      default:
        this.logger.log(`Stripe event received: ${event.type} (${event.id})`);
    }
  }
}
