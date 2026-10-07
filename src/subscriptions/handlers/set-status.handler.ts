import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/** Called by the Stripe webhook handlers (step 14) — no route of its own. */
@Injectable()
export class SetStatusHandler {
  constructor(
    @InjectPinoLogger(SetStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  execute(
    tenantId: number,
    status: SubscriptionStatus,
    tx?: Prisma.TransactionClient,
  ) {
    this.logger.info(`Setting tenant ${tenantId} subscription to ${status}`);
    return this.subscriptions.setStatus(tenantId, status, tx);
  }
}
