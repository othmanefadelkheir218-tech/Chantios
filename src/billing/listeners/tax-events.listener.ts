import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppEventsService } from '../../common/events/app-events.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  BILLING_TAX_SYNC_QUEUE,
  TaxSyncJobData,
} from '../dto/tax-sync-job.dto';

/**
 * Step 27 — the TVA of a company changes from its next invoice:
 *   - its country / TVA number / VIES status changed (C4, from `tenants`);
 *   - the super-admin changed its country's row (C5, from `vat-rates`):
 *     every card subscription of that country.
 * Each becomes one background job (`TaxSyncProcessor`). `tenants` and
 * `vat-rates` never import billing or Stripe: they only announce.
 */
@Injectable()
export class TaxEventsListener implements OnModuleInit {
  constructor(
    @InjectPinoLogger(TaxEventsListener.name)
    private readonly logger: PinoLogger,
    private readonly events: AppEventsService,
    private readonly subscriptions: SubscriptionsService,
    @InjectQueue(BILLING_TAX_SYNC_QUEUE)
    private readonly queue: Queue<TaxSyncJobData>,
  ) {}

  onModuleInit(): void {
    this.events.on('tenant.tax_profile_changed', ({ tenantId }) =>
      this.enqueue([tenantId], `tenant ${tenantId} tax profile changed`),
    );
    this.events.on('vat_rate.changed', async ({ countryCode }) =>
      this.enqueue(
        await this.subscriptions.findCardTenantIds(countryCode),
        `TVA rate of ${countryCode} changed`,
      ),
    );
  }

  async enqueue(tenantIds: number[], why: string): Promise<void> {
    try {
      for (const tenantId of tenantIds) {
        await this.queue.add(
          'sync',
          { tenantId },
          {
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 100,
          },
        );
      }
      this.logger.info(`${why}: ${tenantIds.length} TVA sync job(s) queued`);
    } catch (error) {
      this.logger.error(`${why}: failed to queue TVA sync — ${String(error)}`);
    }
  }
}
