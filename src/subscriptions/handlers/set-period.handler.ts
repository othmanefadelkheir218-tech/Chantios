import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/** Called by the renewal job and the `payment_intent.succeeded` webhook (step 14). */
@Injectable()
export class SetPeriodHandler {
  constructor(
    @InjectPinoLogger(SetPeriodHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  execute(
    tenantId: number,
    periodStart: Date,
    periodEnd: Date,
    tx?: Prisma.TransactionClient,
  ) {
    this.logger.info(
      `Rolling tenant ${tenantId} period to ${periodStart.toISOString()} – ${periodEnd.toISOString()}`,
    );
    return this.subscriptions.setPeriod(tenantId, periodStart, periodEnd, tx);
  }
}
