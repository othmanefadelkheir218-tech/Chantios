import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * Called by the Stripe webhook handlers (step 14) and the trial block (step
 * 20) — no route of its own. `grace_ends_at` lives only while the status is
 * `past_due`: any other status clears it (doc/notes/subscription-plans.md
 * § The end of the trial). `past_due` keeps whatever date is there.
 */
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
    const grace = status === 'past_due' ? undefined : null;
    return this.subscriptions.setStatusAndGrace(tenantId, status, grace, tx);
  }
}
