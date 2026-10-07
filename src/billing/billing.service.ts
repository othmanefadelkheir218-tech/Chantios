import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TenantContextService } from '../common/cls/tenant-context.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { BILLING_RENEWAL_QUEUE, RenewalJobData } from './dto/renewal-job.dto';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { MySubscriptionHandler } from './handlers/my-subscription.handler';
import { RequestDowngradeHandler } from './handlers/request-downgrade.handler';
import { RunRenewalHandler } from './handlers/run-renewal.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class BillingService {
  constructor(
    @InjectPinoLogger(BillingService.name)
    private readonly logger: PinoLogger,
    @InjectQueue(BILLING_RENEWAL_QUEUE)
    private readonly renewalQueue: Queue<RenewalJobData>,
    private readonly mySubscriptionHandler: MySubscriptionHandler,
    private readonly findUsageHandler: FindUsageHandler,
    private readonly requestDowngradeHandler: RequestDowngradeHandler,
    private readonly runRenewalHandler: RunRenewalHandler,
    private readonly subscriptions: SubscriptionsService,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  mySubscription(tenantId: number) {
    return this.mySubscriptionHandler.execute(tenantId);
  }

  usage(tenantId: number) {
    return this.findUsageHandler.execute(tenantId);
  }

  /** Past `billing_usage_snapshots` for the caller's own tenant. */
  invoices(tenantId: number, query: PaginationQueryDto) {
    return this.subscriptions.usage(tenantId, query);
  }

  changePlan(tenantId: number, dto: ChangePlanDto) {
    return this.requestDowngradeHandler.execute(tenantId, dto);
  }

  /** `GET /api/admin/billing/snapshots` — every tenant. */
  allSnapshots(query: PaginationQueryDto) {
    return this.subscriptions.allUsage(query);
  }

  /** The daily cron (`src/crons/billing-renewal.cron.ts`) enqueues one job per overdue tenant. */
  async enqueueRenewal(tenantId: number): Promise<void> {
    await this.renewalQueue.add(
      'renew',
      { tenantId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
    this.logger.info(`Queued renewal for tenant ${tenantId}`);
  }

  /**
   * `POST /api/admin/billing/run-renewal/:tenantId` — manual trigger, for
   * testing: direct-call-and-await (not fire-and-forget) so the admin gets
   * an immediate result. Opens the tenant's CLS context itself, the same way
   * `RenewalProcessor` does for a queued job, since an admin route has an
   * admin actor in context, never a tenant one.
   */
  async runRenewalNow(tenantId: number) {
    this.logger.info(`Manual renewal trigger for tenant ${tenantId}`);
    return this.cls.run(async () => {
      this.tenantContext.setTenantId(tenantId);
      return this.runRenewalHandler.execute(tenantId);
    });
  }
}
