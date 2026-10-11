import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { graceEndOf } from '../helpers/subscription.helper';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * The 7 days to pay (doc/notes/subscription-plans.md § The end of the trial,
 * § A failed payment): `past_due` + `grace_ends_at = from + 7 days`. Used by
 * the end of a trial (`from` = the trial end) and a failed payment
 * (`from` = now).
 *   - already `past_due` with a date → kept: the grace is never extended;
 *   - `cancelled` (blocked) → nothing changes: only a payment reopens it.
 * Returns the block date, or `null` for a blocked company.
 */
@Injectable()
export class StartGraceHandler {
  constructor(
    @InjectPinoLogger(StartGraceHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(tenantId: number, from: Date): Promise<Date | null> {
    const current = await this.subscriptions.findByTenant(tenantId);
    if (!current) {
      throw new NotFoundException('Subscription not found');
    }
    if (current.status === 'cancelled') {
      this.logger.info(`Tenant ${tenantId} is blocked: no new grace period`);
      return null;
    }
    if (current.status === 'past_due' && current.graceEndsAt) {
      this.logger.info(
        `Tenant ${tenantId} already has until ${current.graceEndsAt.toISOString()}: not extended`,
      );
      return current.graceEndsAt;
    }
    const graceEndsAt = graceEndOf(from);
    await this.subscriptions.setStatusAndGrace(
      tenantId,
      'past_due',
      graceEndsAt,
    );
    this.logger.info(
      `Tenant ${tenantId} past_due: blocked on ${graceEndsAt.toISOString()} without a payment`,
    );
    return graceEndsAt;
  }
}
