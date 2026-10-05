import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class FindSubscriptionHandler {
  constructor(
    @InjectPinoLogger(FindSubscriptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(tenantId: number) {
    this.logger.debug(`Finding subscription of tenant ${tenantId}`);

    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription) {
      this.logger.warn(`Subscription not found for tenant ${tenantId}`);
      throw new NotFoundException('Subscription not found for this tenant');
    }
    return subscription;
  }
}
