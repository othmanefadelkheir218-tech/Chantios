import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';
import { REVERSE_CHARGE_DISPLAY_NAME } from '../helpers/invoice-tax.helper';

export interface TaxRateInput {
  countryCode: string;
  /** Percent, as a string ("21.00"). Ignored for a reverse-charge rate (always 0). */
  rate: string;
  /** The 0 % "Autoliquidation" rate of an EU country. */
  reverseCharge: boolean;
}

/**
 * One Stripe TaxRate for the TVA on the subscription (step 27). Exclusive:
 * prices are HT, Stripe adds the TVA on top. A Stripe TaxRate cannot change
 * its percent — a rate change creates a new one (same pattern as plan Prices).
 */
@Injectable()
export class CreateTaxRateHandler {
  constructor(
    @InjectPinoLogger(CreateTaxRateHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(input: TaxRateInput): Promise<string> {
    const { countryCode, reverseCharge } = input;
    const percentage = reverseCharge ? 0 : Number(input.rate);
    try {
      const taxRate = await stripe.taxRates.create({
        display_name: reverseCharge ? REVERSE_CHARGE_DISPLAY_NAME : 'TVA',
        percentage,
        inclusive: false,
        country: countryCode,
        tax_type: 'vat',
        description: reverseCharge
          ? `TVA ${countryCode} autoliquidation 0%`
          : `TVA ${countryCode} ${percentage}%`,
      });
      this.logger.info(
        `Created Stripe tax rate ${taxRate.id} (${countryCode} ${percentage}%${reverseCharge ? ', reverse charge' : ''})`,
      );
      return taxRate.id;
    } catch (error) {
      this.logger.error(
        `Failed to create a Stripe tax rate for ${countryCode}: ${String(error)}`,
      );
      throw new BadGatewayException(
        'Failed to create the Stripe tax rate for this country',
      );
    }
  }
}
