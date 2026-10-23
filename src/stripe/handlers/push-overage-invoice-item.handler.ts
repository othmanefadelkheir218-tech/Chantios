import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * Pushes one renewal's total overage to Stripe as a pending invoice item
 * against the tenant's customer, to be picked up by Stripe's own next
 * invoice for that customer. Best-effort — never throws, same spirit as
 * `ArchivePlanPriceHandler`: a Stripe-side sync failure here is logged, it
 * must never stop the renewal job from writing the snapshot and rolling the
 * period forward (doc/notes/subscription-plans.md).
 */
@Injectable()
export class PushOverageInvoiceItemHandler {
  constructor(
    @InjectPinoLogger(PushOverageInvoiceItemHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * `idempotencyKey` — BullMQ retries `run-renewal` whole on any later
   * failure (rolling the period, applying a pending plan); without this,
   * a retry after a successful push would bill the SAME overage twice.
   * The caller derives it from `(tenantId, periodStart)`, so a retry of the
   * SAME renewal reuses the SAME key and Stripe de-duplicates it for us.
   */
  async execute(
    stripeCustomerId: string | null,
    amount: Prisma.Decimal,
    description: string,
    idempotencyKey: string,
    invoiceId: string | null = null,
    taxRateId: string | null = null,
  ): Promise<void> {
    if (amount.lte(0)) return;
    if (!stripeCustomerId) {
      this.logger.warn(
        `Overage of ${amount.toFixed(2)} EUR not pushed: tenant has no Stripe customer`,
      );
      return;
    }

    try {
      await stripe.invoiceItems.create(
        {
          customer: stripeCustomerId,
          currency: 'eur',
          amount: Math.round(amount.toNumber() * 100),
          description,
          // A card company (step 21): straight onto this month's draft invoice.
          ...(invoiceId && { invoice: invoiceId }),
          // Step 27: the overage is taxed too — set explicitly, never left to
          // the invoice default (a pending item may land on another invoice).
          ...(taxRateId && { tax_rates: [taxRateId] }),
        },
        { idempotencyKey },
      );
      this.logger.info(
        `Pushed overage of ${amount.toFixed(2)} EUR to Stripe customer ${stripeCustomerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to push overage to Stripe customer ${stripeCustomerId}: ${String(error)}`,
      );
    }
  }
}
