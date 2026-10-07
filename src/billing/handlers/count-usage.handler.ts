import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsageCounterHelper } from '../helpers/usage-counter.helper';

/**
 * One count per billed dimension (`{ max_workers: 7, storage_gb: 12.4, ... }`),
 * assuming the caller already set up the tenant context (a request, or a job
 * that opened it the way `TenantRunner` does). The exact shape
 * `SubscriptionsService.snapshotUsage()`'s `usage` input expects.
 */
@Injectable()
export class CountUsageHandler {
  constructor(
    @InjectPinoLogger(CountUsageHandler.name)
    private readonly logger: PinoLogger,
    private readonly usageCounter: UsageCounterHelper,
  ) {}

  async execute(tenantId: number): Promise<Record<string, number>> {
    this.logger.debug(`Counting usage for tenant ${tenantId}`);
    return this.usageCounter.countAll(tenantId);
  }
}
