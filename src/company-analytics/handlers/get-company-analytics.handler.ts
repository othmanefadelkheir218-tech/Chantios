import { Injectable } from '@nestjs/common';
import { PermissionModule } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { loadPermissions } from '../../auth/helpers/permission.helper';
import { ClientsService } from '../../clients/clients.service';
import { localMoment } from '../../common/helpers/tenant-local-time.helper';
import { InvoicesService } from '../../invoices/invoices.service';
import { MarginsService } from '../../margins/margins.service';
import { ProjectsService } from '../../projects/projects.service';
import { PurchaseInvoicesService } from '../../purchase-invoices/purchase-invoices.service';
import { QuotesService } from '../../quotes/quotes.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { TimeEntriesService } from '../../time-entries/time-entries.service';
import { CompanyAnalyticsQueryDto } from '../dto/company-analytics-query.dto';
import {
  agingBlock,
  ANALYTICS_LIST_SIZE,
  marginsBlock,
  percentOf,
  quotesBlock,
  sumAll,
  totalsByMonth,
} from '../helpers/analytics-blocks.helper';
import {
  AnalyticsPeriod,
  periodMoments,
  resolvePeriod,
  toDbDate,
} from '../helpers/analytics-period.helper';

type Blocks = Record<string, unknown>;

/**
 * `GET /api/analytics/overview` — every block in one call
 * (doc/notes/analytics.md). A block is included only if the user can view
 * the module its numbers come from; one the user cannot see is left out.
 * Every number comes from the owning module's service — "unpaid", "late"
 * and the live margin are reused, never written here. `scope = own` narrows
 * `hours` to the user's own entries.
 */
@Injectable()
export class GetCompanyAnalyticsHandler {
  constructor(
    @InjectPinoLogger(GetCompanyAnalyticsHandler.name)
    private readonly logger: PinoLogger,
    private readonly roles: RolesService,
    private readonly tenants: TenantsService,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly timeEntries: TimeEntriesService,
    private readonly quotes: QuotesService,
    private readonly invoices: InvoicesService,
    private readonly purchaseInvoices: PurchaseInvoicesService,
    private readonly margins: MarginsService,
  ) {}

  async execute(
    query: CompanyAnalyticsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<Blocks> {
    const can = await loadPermissions(this.roles, actor.roleId);
    const tenant = await this.tenants.findForNotifications(actor.tenantId);
    const timeZone = tenant?.timezone ?? 'UTC';
    const period = resolvePeriod(query, localMoment(new Date(), timeZone).date);
    this.logger.info(
      `Analytics for user ${actor.userId}: ${period.from} → ${period.to}`,
    );
    const ownId =
      can('time_entries').scope === 'own' ? actor.userId : undefined;

    const builders: [PermissionModule, string, () => Promise<unknown>][] = [
      ['invoices', 'revenue', () => this.revenue(period)],
      [
        'invoices',
        'aging',
        async () => agingBlock(await this.invoices.summarizeAging()),
      ],
      ['invoices', 'topClients', () => this.topClients(period)],
      [
        'margins',
        'margins',
        async () => marginsBlock(await this.margins.findOpenWithBudget()),
      ],
      ['quotes', 'quotes', () => this.quoteStats(period, timeZone)],
      ['time_entries', 'hours', () => this.hours(period, ownId)],
      ['purchase_invoices', 'purchases', () => this.purchases(period)],
    ];

    const visible = builders.filter(([module]) => can(module).canView);
    const values = await Promise.all(visible.map(([, , build]) => build()));
    const blocks: Blocks = { period };
    visible.forEach(([, key], index) => (blocks[key] = values[index]));

    this.logger.info(
      `Analytics for user ${actor.userId}: ${visible.map(([, key]) => key).join(', ') || 'no block'}`,
    );
    return blocks;
  }

  private async revenue(period: AnalyticsPeriod) {
    const [from, to] = [toDbDate(period.from), toDbDate(period.to)];
    const [issued, paid] = await Promise.all([
      this.invoices.invoicedByDay(from, to),
      this.invoices.collectedByDay(from, to),
    ]);
    const invoiced = totalsByMonth(
      period.months,
      issued.map((r) => ({ day: r.day, value: r.amount })),
    );
    const collected = totalsByMonth(
      period.months,
      paid.map((r) => ({ day: r.day, value: r.amount })),
    );
    return {
      invoiced: sumAll(invoiced),
      collected: sumAll(collected),
      byMonth: period.months.map((month, i) => ({
        month,
        invoiced: invoiced[i],
        collected: collected[i],
      })),
    };
  }

  private async topClients(period: AnalyticsPeriod) {
    const rows = await this.invoices.topClients(
      toDbDate(period.from),
      toDbDate(period.to),
      ANALYTICS_LIST_SIZE,
    );
    const names = await this.clients.findNamesByIds(
      rows.map((r) => r.clientId),
    );
    return rows.map((row) => ({
      clientId: row.clientId,
      name: names.find((client) => client.id === row.clientId)?.name ?? null,
      invoiced: row.invoiced,
      collected: row.collected,
      collectedPct: percentOf(row.collected, row.invoiced),
    }));
  }

  private async quoteStats(period: AnalyticsPeriod, timeZone: string) {
    const moments = periodMoments(period);
    const quotes = await this.quotes.findDecisionDatesBetween(
      moments.from,
      moments.to,
    );
    return quotesBlock(quotes, period, timeZone);
  }

  private async hours(period: AnalyticsPeriod, userId?: number) {
    const [from, to] = [toDbDate(period.from), toDbDate(period.to)];
    const [days, top] = await Promise.all([
      this.timeEntries.sumHoursByDay(from, to, userId),
      this.timeEntries.sumHoursByProject(from, to, ANALYTICS_LIST_SIZE, userId),
    ]);
    const byMonth = totalsByMonth(
      period.months,
      days.map((r) => ({ day: r.day, value: r.hours })),
    );
    const names: { id: number; name: string }[] =
      await this.projects.findSummaries(top.map((r) => r.projectId));
    return {
      total: sumAll(byMonth),
      byMonth: period.months.map((month, i) => ({ month, hours: byMonth[i] })),
      byProject: top.map((row) => ({
        projectId: row.projectId,
        name:
          names.find((project) => project.id === row.projectId)?.name ?? null,
        hours: row.hours,
      })),
    };
  }

  private async purchases(period: AnalyticsPeriod) {
    const days = await this.purchaseInvoices.sumIssuedByDay(
      toDbDate(period.from),
      toDbDate(period.to),
    );
    const byMonth = totalsByMonth(
      period.months,
      days.map((r) => ({ day: r.day, value: r.amount })),
    );
    return {
      total: sumAll(byMonth),
      byMonth: period.months.map((month, i) => ({ month, amount: byMonth[i] })),
    };
  }
}
