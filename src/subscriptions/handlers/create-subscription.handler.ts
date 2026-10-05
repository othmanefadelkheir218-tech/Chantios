import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, TenantSubscription } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class CreateSubscriptionHandler {
  constructor(
    @InjectPinoLogger(CreateSubscriptionHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  /** No route: step 02 registration calls this when it creates a tenant. */
  async execute(
    data: Prisma.TenantSubscriptionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TenantSubscription> {
    this.logger.info(`Creating subscription for tenant ${data.tenantId}`);

    if (await this.subscriptions.findByTenant(data.tenantId)) {
      this.logger.warn(`Tenant ${data.tenantId} already has a subscription`);
      throw new ConflictException('This tenant already has a subscription');
    }
    return this.subscriptions.create(data, tx);
  }
}
