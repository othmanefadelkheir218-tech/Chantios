import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BillingService } from '../billing/billing.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TenantRunner } from './tenant-runner.service';

/**
 * Daily, per company: a subscription whose `period_end` has passed gets one
 * renewal job queued (`BillingService.enqueueRenewal` -> `RenewalProcessor`
 * -> `RunRenewalHandler`, step 14). This cron only DECIDES who is due — it
 * holds no billing rule of its own, same spirit as every other cron in this
 * module (doc comment at the top of `crons.module.ts`).
 */
@Injectable()
export class BillingRenewalCron {
  constructor(
    @InjectPinoLogger(BillingRenewalCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly subscriptions: SubscriptionsService,
    private readonly billing: BillingService,
  ) {}

  @Cron('0 4 * * *')
  async run(): Promise<{ queued: number }> {
    let queued = 0;
    try {
      await this.runner.forEachTenant('billing-renewal', async (tenant) => {
        const subscription = await this.subscriptions.findByTenant(tenant.id);
        if (!subscription || subscription.periodEnd > new Date()) return;
        await this.billing.enqueueRenewal(tenant.id);
        queued += 1;
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Billing-renewal cron failed');
    }
    this.logger.info(`Billing-renewal cron: ${queued} tenant(s) queued`);
    return { queued };
  }
}
