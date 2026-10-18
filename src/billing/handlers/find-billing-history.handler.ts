import { Injectable } from '@nestjs/common';
import { BillingUsageSnapshot, Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { periodBilling } from '../helpers/period-billing.helper';

/**
 * The billing history (doc/notes/subscription-plans.md § The billing
 * history): one item per past period — the usage counted at renewal, and
 * what Stripe charged for that period (plan + overage = total). The money
 * comes from Stripe, never recomputed: it always matches the invoices.
 * `billing: null` = Stripe could not be read; the usage still shows.
 */
@Injectable()
export class FindBillingHistoryHandler {
  constructor(
    @InjectPinoLogger(FindBillingHistoryHandler.name)
    private readonly logger: PinoLogger,
    private readonly subscriptions: SubscriptionsService,
    private readonly stripe: StripeService,
  ) {}

  async execute(tenantId: number, { page, limit }: PaginationQueryDto) {
    this.logger.debug(`Billing history of tenant ${tenantId}, page ${page}`);
    const [rows, total] = await this.subscriptions.usagePeriods(
      tenantId,
      toSkip(page, limit),
      limit,
    );
    if (rows.length === 0) return toPaginated([], total, page, limit);

    const { stripeCustomerId } =
      await this.subscriptions.findByTenant(tenantId);
    // No Stripe customer = never paid by card: nothing was charged.
    const invoices = stripeCustomerId
      ? await this.stripe.listCustomerInvoices(stripeCustomerId)
      : [];

    const data = groupByPeriod(rows).map((lines) => ({
      tenantId,
      periodStart: lines[0].periodStart,
      periodEnd: lines[0].periodEnd,
      overageTotal: lines
        .reduce((sum, r) => sum.plus(r.overageAmount), new Prisma.Decimal(0))
        .toFixed(2),
      billing: invoices ? periodBilling(lines[0].periodStart, invoices) : null,
      lines,
    }));
    return toPaginated(data, total, page, limit);
  }
}

/** Rows come newest period first; keeps that order. */
function groupByPeriod(rows: BillingUsageSnapshot[]) {
  const map = new Map<number, BillingUsageSnapshot[]>();
  for (const row of rows) {
    const key = row.periodStart.getTime();
    map.set(key, [...(map.get(key) ?? []), row]);
  }
  return [...map.values()];
}
