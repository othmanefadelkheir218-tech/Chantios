import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * Archives a Stripe TaxRate (`active: false`) after a rate change. Invoices
 * already made keep it. Best-effort: a failure is logged, never thrown.
 */
@Injectable()
export class ArchiveTaxRateHandler {
  constructor(
    @InjectPinoLogger(ArchiveTaxRateHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(taxRateId: string | null): Promise<void> {
    if (!taxRateId) return;

    try {
      await stripe.taxRates.update(taxRateId, { active: false });
      this.logger.info(`Archived Stripe tax rate ${taxRateId}`);
    } catch (error) {
      this.logger.error(
        `Failed to archive Stripe tax rate ${taxRateId}: ${String(error)}`,
      );
    }
  }
}
