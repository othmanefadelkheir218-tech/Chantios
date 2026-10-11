import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PinoLogger } from 'nestjs-pino';
import type { InvoicesService } from '../../invoices/invoices.service';
import type { MarginsService } from '../../margins/margins.service';
import type { MaterialsService } from '../../materials/materials.service';
import type { ProjectsService } from '../../projects/projects.service';
import type { PurchaseInvoicesService } from '../../purchase-invoices/purchase-invoices.service';
import type { QuotesService } from '../../quotes/quotes.service';
import type { RolesService } from '../../roles/roles.service';
import type { TasksService } from '../../tasks/tasks.service';
import type { TenantsService } from '../../tenants/tenants.service';
import type { TimeEntriesService } from '../../time-entries/time-entries.service';
import { dashboardDates } from '../helpers/dashboard-dates.helper';
import { GetDashboardHandler } from './get-dashboard.handler';

// Step 18 — doc/notes/dashboard.md.

describe('dashboardDates', () => {
  it('uses the tenant timezone for today and starts the week on Monday', () => {
    // Saturday 2026-10-10 00:30 in Brussels = Friday 22:30 UTC
    const dates = dashboardDates(
      new Date('2026-10-09T22:30:00Z'),
      'Europe/Brussels',
    );
    expect(dates.today.toISOString().slice(0, 10)).toBe('2026-10-10');
    expect(dates.weekStart.toISOString().slice(0, 10)).toBe('2026-10-05');
  });

  it('on a Monday the week is that day only', () => {
    const dates = dashboardDates(new Date('2026-10-05T10:00:00Z'), 'UTC');
    expect(dates.weekStart.toISOString().slice(0, 10)).toBe('2026-10-05');
  });

  it('on a Sunday the week goes back to Monday', () => {
    const dates = dashboardDates(new Date('2026-10-11T10:00:00Z'), 'UTC');
    expect(dates.weekStart.toISOString().slice(0, 10)).toBe('2026-10-05');
  });
});

describe('GetDashboardHandler', () => {
  const logger = { info: jest.fn() } as unknown as PinoLogger;
  const roles = { findRoleById: jest.fn(), findOverridesForRole: jest.fn() };
  const tenants = {
    findForNotifications: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
  };
  const projects = {
    countOpenByStatus: jest
      .fn()
      .mockResolvedValue({ prospect: 1, in_progress: 2 }),
  };
  const tasks = {
    countDueTodayAndOverdue: jest
      .fn()
      .mockResolvedValue({ dueToday: 3, overdue: 1 }),
  };
  const timeEntries = {
    sumHoursBetween: jest.fn().mockResolvedValue(new Prisma.Decimal('12.5')),
  };
  const quotes = {
    summarizeSent: jest
      .fn()
      .mockResolvedValue({ count: 2, totalInclVat: '100' }),
  };
  const invoices = {
    summarizeUnpaid: jest.fn().mockResolvedValue({
      unpaidCount: 4,
      unpaidBalance: '400',
      overdueCount: 1,
      overdueBalance: '50',
    }),
  };
  const purchaseInvoices = {
    dueSoon: jest
      .fn()
      .mockResolvedValue([
        { amountInclVat: new Prisma.Decimal('10.50') },
        { amountInclVat: new Prisma.Decimal('4.50') },
      ]),
  };
  const materials = { lowStock: jest.fn().mockResolvedValue([{}, {}, {}]) };
  const margins = {
    countOpenProjectsByLevel: jest
      .fn()
      .mockResolvedValue({ warning: 1, critical: 2 }),
  };

  const handler = new GetDashboardHandler(
    logger,
    roles as unknown as RolesService,
    tenants as unknown as TenantsService,
    projects as unknown as ProjectsService,
    tasks as unknown as TasksService,
    timeEntries as unknown as TimeEntriesService,
    quotes as unknown as QuotesService,
    invoices as unknown as InvoicesService,
    purchaseInvoices as unknown as PurchaseInvoicesService,
    materials as unknown as MaterialsService,
    margins as unknown as MarginsService,
  );
  const actor = { userId: 9, tenantId: 1, roleId: 1, email: 'x@y.be' };

  beforeEach(() => {
    jest.clearAllMocks();
    roles.findOverridesForRole.mockResolvedValue([]);
  });

  it('admin sees the 8 widgets', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    const result = await handler.execute(actor);

    expect(Object.keys(result).sort()).toEqual(
      [
        'hours',
        'invoices',
        'margins',
        'projects',
        'purchaseInvoices',
        'quotes',
        'stock',
        'tasks',
      ].sort(),
    );
    expect(result.invoices).toEqual({
      unpaid: { count: 4, balanceDue: '400' },
      overdue: { count: 1, balanceDue: '50' },
    });
    expect(result.purchaseInvoices).toMatchObject({ days: 7, count: 2 });
    expect(
      String(
        (result.purchaseInvoices as { amountInclVat: unknown }).amountInclVat,
      ),
    ).toBe('15');
    expect(result.stock).toEqual({ lowStockCount: 3 });
    // scope all: no user filter
    expect(tasks.countDueTodayAndOverdue).toHaveBeenCalledWith(
      expect.any(Date),
      undefined,
    );
  });

  it('a widget the user cannot view is left out, and not computed', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    roles.findOverridesForRole.mockResolvedValue([
      {
        module: 'invoices',
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'all',
      },
    ]);
    const result = await handler.execute(actor);

    expect(result).not.toHaveProperty('invoices');
    expect(invoices.summarizeUnpaid).not.toHaveBeenCalled();
  });

  it('scope own narrows tasks and hours to the user', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    roles.findOverridesForRole.mockResolvedValue([
      {
        module: 'tasks',
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'own',
      },
      {
        module: 'time_entries',
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'own',
      },
    ]);
    await handler.execute(actor);

    expect(tasks.countDueTodayAndOverdue).toHaveBeenCalledWith(
      expect.any(Date),
      9,
    );
    expect(timeEntries.sumHoursBetween).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      9,
    );
  });

  it('a worker only gets the widgets of the modules a worker can view', async () => {
    roles.findRoleById.mockResolvedValue({ id: 5, name: 'worker' });
    const result = await handler.execute({ ...actor, roleId: 5 });

    expect(result).not.toHaveProperty('invoices');
    expect(result).not.toHaveProperty('quotes');
    expect(result).not.toHaveProperty('margins');
  });

  it('an unknown role is refused like the guard does', async () => {
    roles.findRoleById.mockResolvedValue(null);
    await expect(handler.execute(actor)).rejects.toThrow(ForbiddenException);
  });
});
