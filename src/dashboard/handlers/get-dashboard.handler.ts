import { ForbiddenException, Injectable } from '@nestjs/common';
import { PermissionModule, Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import {
  ResolvedPermission,
  resolvePermission,
  RoleName,
} from '../../auth/helpers/permission.helper';
import { InvoicesService } from '../../invoices/invoices.service';
import { MarginsService } from '../../margins/margins.service';
import { MaterialsService } from '../../materials/materials.service';
import { ProjectsService } from '../../projects/projects.service';
import { PURCHASE_DUE_DAYS } from '../../purchase-invoices/helpers/purchase-invoice.helper';
import { PurchaseInvoicesService } from '../../purchase-invoices/purchase-invoices.service';
import { QuotesService } from '../../quotes/quotes.service';
import { RolesService } from '../../roles/roles.service';
import { TasksService } from '../../tasks/tasks.service';
import { TenantsService } from '../../tenants/tenants.service';
import { TimeEntriesService } from '../../time-entries/time-entries.service';
import { dashboardDates } from '../helpers/dashboard-dates.helper';

type Widgets = Record<string, unknown>;

/**
 * `GET /api/dashboard` — every widget in one call (doc/notes/dashboard.md).
 * A widget is included only if the user can view its module; one the user
 * cannot see is left out (not null, not zero). Every number comes from the
 * owning module's service — no rule is written here. `scope = own` narrows
 * the widgets whose module filters by user (tasks, hours); the other modules
 * have no "own" rows, so their widget follows the module's own list.
 */
@Injectable()
export class GetDashboardHandler {
  constructor(
    @InjectPinoLogger(GetDashboardHandler.name)
    private readonly logger: PinoLogger,
    private readonly roles: RolesService,
    private readonly tenants: TenantsService,
    private readonly projects: ProjectsService,
    private readonly tasks: TasksService,
    private readonly timeEntries: TimeEntriesService,
    private readonly quotes: QuotesService,
    private readonly invoices: InvoicesService,
    private readonly purchaseInvoices: PurchaseInvoicesService,
    private readonly materials: MaterialsService,
    private readonly margins: MarginsService,
  ) {}

  async execute(actor: AuthenticatedUser): Promise<Widgets> {
    const can = await this.permissionsOf(actor);
    const tenant = await this.tenants.findForNotifications(actor.tenantId);
    const { today, weekStart } = dashboardDates(
      new Date(),
      tenant?.timezone ?? 'UTC',
    );
    const ownId = (module: PermissionModule) =>
      can(module).scope === 'own' ? actor.userId : undefined;

    const builders: [PermissionModule, string, () => Promise<unknown>][] = [
      [
        'projects',
        'projects',
        async () => ({
          byStatus: await this.projects.countOpenByStatus(),
        }),
      ],
      [
        'tasks',
        'tasks',
        () => this.tasks.countDueTodayAndOverdue(today, ownId('tasks')),
      ],
      [
        'time_entries',
        'hours',
        async () => ({
          from: weekStart.toISOString().slice(0, 10),
          to: today.toISOString().slice(0, 10),
          total: await this.timeEntries.sumHoursBetween(
            weekStart,
            today,
            ownId('time_entries'),
          ),
        }),
      ],
      ['quotes', 'quotes', () => this.quotes.summarizeSent()],
      [
        'invoices',
        'invoices',
        async () => {
          const s = await this.invoices.summarizeUnpaid();
          return {
            unpaid: { count: s.unpaidCount, balanceDue: s.unpaidBalance },
            overdue: { count: s.overdueCount, balanceDue: s.overdueBalance },
          };
        },
      ],
      [
        'purchase_invoices',
        'purchaseInvoices',
        async () => {
          const bills = await this.purchaseInvoices.dueSoon(PURCHASE_DUE_DAYS);
          return {
            days: PURCHASE_DUE_DAYS,
            count: bills.length,
            amountInclVat: bills.reduce(
              (sum, bill) => sum.add(bill.amountInclVat),
              new Prisma.Decimal(0),
            ),
          };
        },
      ],
      [
        'stock',
        'stock',
        async () => ({
          lowStockCount: (await this.materials.lowStock()).length,
        }),
      ],
      ['margins', 'margins', () => this.margins.countOpenProjectsByLevel()],
    ];

    const visible = builders.filter(([module]) => can(module).canView);
    const values = await Promise.all(visible.map(([, , build]) => build()));
    const widgets: Widgets = {};
    visible.forEach(([, key], index) => (widgets[key] = values[index]));

    this.logger.info(
      `Dashboard for user ${actor.userId}: ${Object.keys(widgets).join(', ') || 'no widget'}`,
    );
    return widgets;
  }

  /** Same resolution as `PermissionGuard`: default matrix + this tenant's overrides. */
  private async permissionsOf(
    actor: AuthenticatedUser,
  ): Promise<(module: PermissionModule) => ResolvedPermission> {
    const role = await this.roles.findRoleById(actor.roleId);
    if (!role) {
      throw new ForbiddenException('Unknown role');
    }
    const overrides = await this.roles.findOverridesForRole(actor.roleId);
    return (module) =>
      resolvePermission(role.name as RoleName, module, overrides);
  }
}
