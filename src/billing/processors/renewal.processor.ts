import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { BILLING_RENEWAL_QUEUE, RenewalJobData } from '../dto/renewal-job.dto';
import { RunRenewalHandler } from '../handlers/run-renewal.handler';

/**
 * One job per tenant. A BullMQ job runs with no request and no tenant in
 * `nestjs-cls`, so this opens the same kind of scoped context `TenantRunner`
 * opens for a cron — the tenant-scoped services `run-renewal.handler` calls
 * (clients, subcontractors, media) need it to resolve the right tenant.
 */
@Processor(BILLING_RENEWAL_QUEUE)
export class RenewalProcessor extends WorkerHost {
  constructor(
    private readonly runRenewal: RunRenewalHandler,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
  ) {
    super();
  }

  async process(job: Job<RenewalJobData>): Promise<void> {
    const { tenantId } = job.data;
    await this.cls.run(async () => {
      this.tenantContext.setTenantId(tenantId);
      await this.runRenewal.execute(tenantId);
    });
  }
}
