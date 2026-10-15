import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { TenantContextService } from '../common/cls/tenant-context.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CardPaymentDto } from './dto/card-payment.dto';
import { ChangePlanDto } from './dto/change-plan.dto';
import { FindSnapshotsQueryDto } from './dto/find-snapshots-query.dto';
import {
  BILLING_RENEWAL_QUEUE,
  RenewalJobData,
  StripeRenewalInput,
} from './dto/renewal-job.dto';
import { FindUsageHandler } from './handlers/find-usage.handler';
import { MySubscriptionHandler } from './handlers/my-subscription.handler';
import { OpenPortalHandler } from './handlers/open-portal.handler';
import { RequestDowngradeHandler } from './handlers/request-downgrade.handler';
import { RunRenewalHandler } from './handlers/run-renewal.handler';
import { CancelCardSubscriptionHandler } from './handlers/cancel-card-subscription.handler';
import { StartCheckoutHandler } from './handlers/start-checkout.handler';
import { BlockExpiredGraceHandler } from './handlers/block-expired-grace.handler';
import { TrialReminderHandler } from './handlers/trial-reminder.handler';

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
    private readonly trialReminderHandler: TrialReminderHandler,
    private readonly blockExpiredGraceHandler: BlockExpiredGraceHandler,
    private readonly startCheckoutHandler: StartCheckoutHandler,
    private readonly openPortalHandler: OpenPortalHandler,
    private readonly cancelCardSubscriptionHandler: CancelCardSubscriptionHandler,
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

  // ---- Step 21 — paying by card (Stripe Checkout) ----

  /** "Pay": the Stripe page to open (Checkout, or the unpaid invoice). */
  startCheckout(tenantId: number, dto: CardPaymentDto) {
    return this.startCheckoutHandler.execute(tenantId, dto);
  }

  /** "Manage payment": the Stripe Customer Portal. */
  openPortal(tenantId: number, dto: CardPaymentDto) {
    return this.openPortalHandler.execute(tenantId, dto);
  }

  /** Cancel at the end of the paid month, no refund — then the new state. */
  async cancelAtPeriodEnd(tenantId: number) {
    await this.cancelCardSubscriptionHandler.execute(tenantId, true);
    return this.mySubscriptionHandler.execute(tenantId);
  }

  /** Undo a cancel before the month ends — then the new state. */
  async resume(tenantId: number) {
    await this.cancelCardSubscriptionHandler.execute(tenantId, false);
    return this.mySubscriptionHandler.execute(tenantId);
  }

  /**
   * A card company's renewal, from Stripe's `invoice.created` (Q2). A webhook
   * has no tenant in context: open it, the same way `runRenewalNow` does.
   */
  renewForStripeInvoice(tenantId: number, input: StripeRenewalInput) {
    return this.cls.run(async () => {
      this.tenantContext.setTenantId(tenantId);
      return this.runRenewalHandler.executeForStripeInvoice(tenantId, input);
    });
  }

  /** `GET /api/admin/billing/snapshots` — one tenant with `tenant_id`, else every tenant. */
  allSnapshots(query: FindSnapshotsQueryDto) {
    return query.tenant_id
      ? this.subscriptions.usage(query.tenant_id, query)
      : this.subscriptions.allUsage(query);
  }

  /** Day 11 of a trial (`src/crons/trial-end.cron.ts`, inside the tenant's CLS). */
  remindTrialEnding(tenantId: number, now: Date) {
    return this.trialReminderHandler.execute(tenantId, now);
  }

  /** Day 21: block a company whose grace period ran out (`src/crons/trial-end.cron.ts`). */
  blockIfGraceOver(tenantId: number, now: Date) {
    return this.blockExpiredGraceHandler.execute(tenantId, now);
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
