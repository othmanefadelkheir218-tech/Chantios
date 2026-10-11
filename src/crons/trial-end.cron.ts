import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BillingService } from '../billing/billing.service';
import { TenantRunner } from './tenant-runner.service';

/**
 * Daily, per company, after the renewal cron (04:00): the day-11 trial
 * reminder, and the block of a company whose 7 days to pay ran out (trial
 * end or failed payment) (doc/notes/subscription-plans.md § The end of
 * the trial). The day-14 switch to `past_due` happens in the renewal itself.
 * No rule here — `BillingService` decides.
 */
@Injectable()
export class TrialEndCron {
  constructor(
    @InjectPinoLogger(TrialEndCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly billing: BillingService,
  ) {}

  @Cron('30 4 * * *')
  async run(
    now: Date = new Date(),
  ): Promise<{ reminded: number; blocked: number }> {
    let reminded = 0;
    let blocked = 0;
    try {
      await this.runner.forEachTenant('trial-end', async (tenant) => {
        if (await this.billing.remindTrialEnding(tenant.id, now)) reminded += 1;
        if (await this.billing.blockIfGraceOver(tenant.id, now)) blocked += 1;
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Trial-end cron failed');
    }
    this.logger.info(
      `Trial-end cron: ${reminded} reminded, ${blocked} blocked`,
    );
    return { reminded, blocked };
  }
}
