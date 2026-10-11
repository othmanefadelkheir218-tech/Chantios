import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { shiftBack } from '../helpers/subscription.helper';
import { SubscriptionRepository } from '../repositories/subscription.repository';

/**
 * Dev tools only (step 20): "as if `days` days passed". Every date of the
 * subscription moves `days` earlier — period, pending plan date, grace date —
 * so the real jobs, which compare with the real clock, see them as due.
 * Never reachable in production (`DevToolsGuard`).
 */
@Injectable()
export class ShiftDatesHandler {
  constructor(
    @InjectPinoLogger(ShiftDatesHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionRepository,
  ) {}

  async execute(tenantId: number, days: number) {
    const current = await this.subscriptions.findByTenant(tenantId);
    if (!current) {
      throw new NotFoundException('Subscription not found');
    }
    this.logger.warn(
      `DEV TOOLS: moving tenant ${tenantId} subscription dates ${days} day(s) back`,
    );
    return this.subscriptions.setDates(tenantId, {
      periodStart: shiftBack(current.periodStart, days),
      periodEnd: shiftBack(current.periodEnd, days),
      pendingPlanEffectiveAt: shiftBack(current.pendingPlanEffectiveAt, days),
      graceEndsAt: shiftBack(current.graceEndsAt, days),
    });
  }
}
