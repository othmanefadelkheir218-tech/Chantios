import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * A plan change waits for the END of the current period. When a successful
 * payment moves the period (`payment_intent.succeeded`), the waiting change
 * must follow it, or its date would point at a period end that no longer
 * exists. Used ONLY by that webhook — never by the renewal job, which must
 * compare the untouched date to decide whether the change is due.
 */
@Injectable()
export class MovePendingPlanDateHandler {
  constructor(
    @InjectPinoLogger(MovePendingPlanDateHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(tenantId: number, effectiveAt: Date): Promise<void> {
    const { count } = await this.subscriptions.movePendingPlanDate(
      tenantId,
      effectiveAt,
    );
    if (count > 0) {
      this.logger.info(
        `Tenant ${tenantId}: waiting plan change now due ${effectiveAt.toISOString()}`,
      );
    }
  }
}
