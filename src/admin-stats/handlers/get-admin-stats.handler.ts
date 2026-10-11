import { Injectable } from '@nestjs/common';
import { SubscriptionStatus, TenantStatus } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FeedbackService } from '../../feedback/feedback.service';
import { PlansService } from '../../plans/plans.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SupportService } from '../../support/support.service';
import { TenantsService } from '../../tenants/tenants.service';
import { lastMonths } from '../helpers/stats-months.helper';

/** Every enum value at 0, then the counted ones on top — a missing status reads 0, never undefined. */
function byStatus<S extends string>(
  values: readonly S[],
  rows: { status: S; count: number }[],
): Record<S, number> {
  const out = Object.fromEntries(values.map((v) => [v, 0])) as Record<
    S,
    number
  >;
  for (const r of rows) out[r.status] = r.count;
  return out;
}

/**
 * `GET /api/admin/stats` — the platform home page in one call
 * (doc/notes/admin-stats.md). No table and no rule of its own: every number
 * comes from the owning module's service; this handler only shapes them.
 */
@Injectable()
export class GetAdminStatsHandler {
  constructor(
    @InjectPinoLogger(GetAdminStatsHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly support: SupportService,
    private readonly feedback: FeedbackService,
  ) {}

  async execute(now = new Date()) {
    this.logger.debug('Building the platform stats');
    const { months, since } = lastMonths(now);

    const [
      tenantRows,
      subscriptionRows,
      planRows,
      perMonth,
      tickets,
      newFeedback,
    ] = await Promise.all([
      this.tenants.countByStatus(),
      this.subscriptions.countByStatus(),
      this.subscriptions.countByPlan(),
      this.tenants.countCreatedPerMonth(since),
      this.support.countOpenForAdmin(),
      this.feedback.countByStatus('new'),
    ]);

    const createdIn = new Map(perMonth.map((r) => [r.month, r.count]));

    return {
      tenants: {
        total: tenantRows.reduce((sum, r) => sum + r.count, 0),
        ...byStatus(Object.values(TenantStatus), tenantRows),
      },
      subscriptions: byStatus(
        Object.values(SubscriptionStatus),
        subscriptionRows,
      ),
      support: tickets,
      feedback: { new: newFeedback },
      growth: months.map((month) => ({
        month,
        newTenants: createdIn.get(month) ?? 0,
      })),
      planSplit: await this.planSplit(planRows),
    };
  }

  /**
   * Companies per plan NAME: a plan's old versions are separate `plans` rows
   * with the same name, so they are added together. Biggest first.
   */
  private async planSplit(rows: { planId: number; count: number }[]) {
    const names = await this.plans.findNames(rows.map((r) => r.planId));
    const nameOf = new Map(names.map((p) => [p.id, p.name]));
    const perName = new Map<string, number>();
    for (const r of rows) {
      const name = nameOf.get(r.planId) ?? `#${r.planId}`;
      perName.set(name, (perName.get(name) ?? 0) + r.count);
    }
    return [...perName]
      .map(([planName, tenants]) => ({ planName, tenants }))
      .sort((a, b) => b.tenants - a.tenants);
  }
}
