import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';
import {
  REVERSE_CHARGE_DISPLAY_NAME,
  TaxRateInfo,
} from '../helpers/invoice-tax.helper';

/**
 * Step 27 — the percent of each Stripe TaxRate on an invoice. A TaxRate's
 * percent can never change in Stripe, so an answer is kept for the life of
 * the process. Best-effort: an id Stripe cannot give back is simply missing
 * from the map (the amount still shows, without its rate).
 */
@Injectable()
export class FindTaxRatesHandler {
  private readonly cache = new Map<string, TaxRateInfo>();

  constructor(
    @InjectPinoLogger(FindTaxRatesHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(ids: string[]): Promise<Map<string, TaxRateInfo>> {
    const missing = ids.filter((id) => !this.cache.has(id));
    await Promise.all(
      missing.map(async (id) => {
        try {
          const taxRate = await stripe.taxRates.retrieve(id);
          this.cache.set(id, {
            percentage: taxRate.percentage.toFixed(2),
            reverseCharge: taxRate.display_name === REVERSE_CHARGE_DISPLAY_NAME,
          });
        } catch (error) {
          this.logger.warn(
            `Failed to read Stripe tax rate ${id}: ${String(error)}`,
          );
        }
      }),
    );
    return new Map(
      ids
        .filter((id) => this.cache.has(id))
        .map((id) => [id, this.cache.get(id)!]),
    );
  }
}
