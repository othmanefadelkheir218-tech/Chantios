import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { CardPaymentDto } from '../dto/card-payment.dto';
import {
  billingPageUrl,
  isRealStripeCustomer,
} from '../helpers/card-payment.helper';

/** `POST /api/billing/portal` — "Manage payment": change the card, see Stripe invoices (Q5). */
@Injectable()
export class OpenPortalHandler {
  constructor(
    @InjectPinoLogger(OpenPortalHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly stripe: StripeService,
  ) {}

  async execute(
    tenantId: number,
    { locale }: CardPaymentDto,
  ): Promise<{ url: string }> {
    const { stripeCustomerId } =
      await this.subscriptions.findByTenant(tenantId);
    if (!isRealStripeCustomer(stripeCustomerId)) {
      this.logger.warn(`Tenant ${tenantId} has no Stripe customer: no portal`);
      throw new ConflictException('No card on file yet — use "Pay" first');
    }
    const url = await this.stripe.createPortalSession(
      stripeCustomerId,
      locale,
      billingPageUrl(locale),
    );
    this.logger.info(`Tenant ${tenantId} opens the Stripe portal`);
    return { url };
  }
}
