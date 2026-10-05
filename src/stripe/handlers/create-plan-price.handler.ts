import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { stripe } from '../../config/stripe.config';

/**
 * One Stripe Product + one recurring monthly Price, in EUR (the only
 * currency used anywhere else in this app). See doc/notes/subscription-plans.md
 * § "stripe_price_id is managed by the app".
 */
@Injectable()
export class CreatePlanPriceHandler {
  constructor(
    @InjectPinoLogger(CreatePlanPriceHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(name: string, basePrice: string): Promise<string> {
    try {
      const product = await stripe.products.create({ name });
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: Math.round(Number(basePrice) * 100),
        recurring: { interval: 'month' },
      });
      this.logger.info(`Created Stripe price ${price.id} for plan "${name}"`);
      return price.id;
    } catch (error) {
      this.logger.error(
        `Failed to create a Stripe price for plan "${name}": ${String(error)}`,
      );
      throw new BadGatewayException(
        'Failed to create the Stripe price for this plan',
      );
    }
  }
}
