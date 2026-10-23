import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  BILLING_TAX_SYNC_QUEUE,
  TaxSyncJobData,
} from '../dto/tax-sync-job.dto';
import { SyncTenantTaxHandler } from '../handlers/sync-tenant-tax.handler';

/**
 * One job per company (step 27, C4 / C5). Every read here is cross-tenant
 * (subscription by tenant id, tenant, TVA table, Stripe), so no tenant
 * context is needed. Stripe down → the job throws and BullMQ retries.
 */
@Processor(BILLING_TAX_SYNC_QUEUE)
export class TaxSyncProcessor extends WorkerHost {
  constructor(private readonly syncTenantTax: SyncTenantTaxHandler) {
    super();
  }

  async process(job: Job<TaxSyncJobData>): Promise<void> {
    await this.syncTenantTax.execute(job.data.tenantId);
  }
}
