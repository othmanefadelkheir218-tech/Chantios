import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { IMPORTS_QUEUE, ImportJobData } from '../dto/import-job.dto';
import { RunImportHandler } from '../handlers/run-import.handler';

/**
 * One job per import batch. A BullMQ job runs with no request and no tenant
 * in `nestjs-cls`, so this opens the same scoped context `TenantGuard` opens
 * for a route — every tenant-scoped repository the import touches reads it.
 */
@Processor(IMPORTS_QUEUE)
export class ImportProcessor extends WorkerHost {
  constructor(
    private readonly runImport: RunImportHandler,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<void> {
    const { batchId, tenantId, userId } = job.data;
    await this.cls.run(async () => {
      this.tenantContext.setTenantId(tenantId);
      this.tenantContext.setUserId(userId);
      await this.runImport.execute(batchId, { tenantId, userId });
    });
  }
}
