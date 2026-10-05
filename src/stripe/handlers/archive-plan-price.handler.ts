import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * Archives a Stripe Price (`active: false`) — Stripe's equivalent of this
 * app's `is_active` flag; it has no hard delete for a Price either, and
 * archiving never affects tenants already subscribed to it.
 *
 * Best-effort: a failure here is logged, never thrown. This is a Stripe-side
 * sync action, not a data-integrity one — see doc/notes/subscription-plans.md.
 */
@Injectable()
export class ArchivePlanPriceHandler {
  constructor(
    @InjectPinoLogger(ArchivePlanPriceHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(stripePriceId: string | null): Promise<void> {
    if (!stripePriceId) return;

    try {
      await stripe.prices.update(stripePriceId, { active: false });
      this.logger.info(`Archived Stripe price ${stripePriceId}`);
    } catch (error) {
      this.logger.error(
        `Failed to archive Stripe price ${stripePriceId}: ${String(error)}`,
      );
    }
  }
}
