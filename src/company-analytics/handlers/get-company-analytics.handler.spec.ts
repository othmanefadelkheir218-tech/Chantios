import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PinoLogger } from 'nestjs-pino';
import type { ClientsService } from '../../clients/clients.service';
import type { InvoicesService } from '../../invoices/invoices.service';
import type { MarginRow } from '../../margins/helpers/margin.helper';
import type { MarginsService } from '../../margins/margins.service';
import type { ProjectsService } from '../../projects/projects.service';
import type { PurchaseInvoicesService } from '../../purchase-invoices/purchase-invoices.service';
import type { QuotesService } from '../../quotes/quotes.service';
import type { RolesService } from '../../roles/roles.service';
import type { TenantsService } from '../../tenants/tenants.service';
import type { TimeEntriesService } from '../../time-entries/time-entries.service';
import {
  agingBlock,
  marginsBlock,
  quotesBlock,
  totalsByMonth,
} from '../helpers/analytics-blocks.helper';
import { resolvePeriod } from '../helpers/analytics-period.helper';
import { GetCompanyAnalyticsHandler } from './get-company-analytics.handler';

// Step 22 — doc/notes/analytics.md.

const D = (value: string | number) => new Prisma.Decimal(value);
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('resolvePeriod', () => {
  it('defaults to this month and the 11 before it', () => {
    const period = resolvePeriod({}, '2026-10-17');
    expect(period.from).toBe('2025-11-01');
    expect(period.to).toBe('2026-10-17');
    expect(period.months).toHaveLength(12);
    expect(period.months[0]).toBe('2025-11');
    expect(period.months[11]).toBe('2026-10');
  });

  it('keeps a custom period, one month when from and to share it', () => {
    const period = resolvePeriod(
      { from: '2026-10-01', to: '2026-10-31' },
      '2026-10-17',
    );
    expect(period.months).toEqual(['2026-10']);
  });

  it('refuses from after to', () => {
    expect(() =>
      resolvePeriod({ from: '2026-10-10', to: '2026-10-01' }, '2026-10-17'),
    ).toThrow(BadRequestException);
  });

  it('accepts 24 months and refuses 25', () => {
    expect(
      resolvePeriod({ from: '2024-11-01', to: '2026-10-31' }, '2026-10-17')
        .months,
    ).toHaveLength(24);
    expect(() =>
      resolvePeriod({ from: '2024-10-31', to: '2026-10-01' }, '2026-10-17'),
    ).toThrow(BadRequestException);
  });
});

describe('analytics blocks', () => {
  it('fills every month, an empty month is 0', () => {
    const totals = totalsByMonth(
      ['2026-06', '2026-07', '2026-08'],
      [
        { day: day('2026-06-03'), value: D(100) },
        { day: day('2026-06-20'), value: D(50) },
        { day: day('2026-08-01'), value: D(10) },
      ],
    );
    expect(totals.map(String)).toEqual(['150', '0', '10']);
  });

  it('quotes: conversion = accepted ÷ sent in the period, per month by each date', () => {
    const period = resolvePeriod(
      { from: '2026-09-01', to: '2026-10-31' },
      '2026-10-17',
    );
    const quotes = [
      {
        status: 'accepted',
        sentAt: day('2026-09-02'),
        acceptedAt: day('2026-10-05'),
        refusedAt: null,
      },
      {
        status: 'refused',
        sentAt: day('2026-09-10'),
        acceptedAt: null,
        refusedAt: day('2026-09-20'),
      },
      {
        status: 'sent',
        sentAt: day('2026-10-01'),
        acceptedAt: null,
        refusedAt: null,
      },
      // sent before the period, accepted in it: counts in October's "accepted" only
      {
        status: 'accepted',
        sentAt: day('2026-08-01'),
        acceptedAt: day('2026-10-02'),
        refusedAt: null,
      },
    ] as const;
    const block = quotesBlock([...quotes], period, 'UTC');
    expect(block).toMatchObject({
      sent: 3,
      accepted: 1,
      refused: 1,
      waiting: 1,
    });
    expect(String(block.conversionPct)).toBe('33.3');
    expect(block.byMonth).toEqual([
      { month: '2026-09', sent: 2, accepted: 0, refused: 1 },
      { month: '2026-10', sent: 1, accepted: 2, refused: 0 },
    ]);
  });

  it('quotes: no quote sent → no conversion rate', () => {
    const period = resolvePeriod({}, '2026-10-17');
    expect(quotesBlock([], period, 'UTC').conversionPct).toBeNull();
  });

  it('quotes: a moment is put in its month in the tenant timezone', () => {
    const period = resolvePeriod(
      { from: '2026-10-01', to: '2026-10-31' },
      '2026-10-17',
    );
    // 30 Sept 23:30 UTC = 1 Oct 01:30 in Brussels
    const block = quotesBlock(
      [
        {
          status: 'sent',
          sentAt: new Date('2026-09-30T23:30:00Z'),
          acceptedAt: null,
          refusedAt: null,
        },
      ],
      period,
      'Europe/Brussels',
    );
    expect(block.sent).toBe(1);
  });

  it('margins: weighted average, best and worst never share a project', () => {
    const row = (projectId: number, budget: number, margin: number) =>
      ({
        projectId,
        name: `P${projectId}`,
        status: 'in_progress',
        budgetExclVat: D(budget),
        materialCost: D(0),
        laborCost: D(0),
        billCost: D(0),
        totalCost: D(budget - margin),
        marginExclVat: D(margin),
        marginPct: D((margin / budget) * 100),
      }) as MarginRow;
    // best first, as the repository returns them
    const rows = [row(1, 1000, 500), row(2, 1000, 300), row(3, 8000, 800)];
    const block = marginsBlock(rows);
    expect(String(block.averagePct)).toBe('16'); // 1600 / 10000
    expect(block.best.map((p) => p.projectId)).toEqual([1, 2, 3]);
    expect(block.worst).toEqual([]);
  });

  it('aging: the four groups in order, an empty one is 0, plus the total', () => {
    const block = agingBlock([
      { bucket: 'late_31_60', count: 2, balanceDue: D(300) },
      { bucket: 'not_due', count: 1, balanceDue: D(100) },
    ]);
    expect(block.buckets.map((b) => [b.bucket, b.count])).toEqual([
      ['not_due', 1],
      ['late_1_30', 0],
      ['late_31_60', 2],
      ['late_60_plus', 0],
    ]);
    expect(block.total.count).toBe(3);
    expect(String(block.total.balanceDue)).toBe('400');
  });
});

describe('GetCompanyAnalyticsHandler', () => {
  const logger = { info: jest.fn() } as unknown as PinoLogger;
  const roles = { findRoleById: jest.fn(), findOverridesForRole: jest.fn() };
  const tenants = {
    findForNotifications: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
  };
  const clients = {
    findNamesByIds: jest
      .fn()
      .mockResolvedValue([{ id: 3, name: 'SCI Les Acacias' }]),
  };
  const projects = {
    findSummaries: jest.fn().mockResolvedValue([{ id: 8, name: 'Rénovation' }]),
  };
  const timeEntries = {
    sumHoursByDay: jest
      .fn()
      .mockResolvedValue([{ day: day('2026-10-02'), hours: D(8) }]),
    sumHoursByProject: jest
      .fn()
      .mockResolvedValue([{ projectId: 8, hours: D(8) }]),
  };
  const quotes = { findDecisionDatesBetween: jest.fn().mockResolvedValue([]) };
  const invoices = {
    invoicedByDay: jest
      .fn()
      .mockResolvedValue([{ day: day('2026-09-05'), amount: D(1210) }]),
    collectedByDay: jest
      .fn()
      .mockResolvedValue([{ day: day('2026-10-01'), amount: D(605) }]),
    topClients: jest
      .fn()
      .mockResolvedValue([
        { clientId: 3, invoiced: D(1210), collected: D(605) },
      ]),
    summarizeAging: jest.fn().mockResolvedValue([]),
  };
  const purchaseInvoices = { sumIssuedByDay: jest.fn().mockResolvedValue([]) };
  const margins = { findOpenWithBudget: jest.fn().mockResolvedValue([]) };

  const handler = new GetCompanyAnalyticsHandler(
    logger,
    roles as unknown as RolesService,
    tenants as unknown as TenantsService,
    clients as unknown as ClientsService,
    projects as unknown as ProjectsService,
    timeEntries as unknown as TimeEntriesService,
    quotes as unknown as QuotesService,
    invoices as unknown as InvoicesService,
    purchaseInvoices as unknown as PurchaseInvoicesService,
    margins as unknown as MarginsService,
  );
  const actor = { userId: 9, tenantId: 1, roleId: 1, email: 'x@y.be' };
  const query = { from: '2026-09-01', to: '2026-10-31' };

  beforeEach(() => {
    jest.clearAllMocks();
    roles.findOverridesForRole.mockResolvedValue([]);
  });

  it('admin sees every block', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    const result = await handler.execute(query, actor);

    expect(Object.keys(result).sort()).toEqual(
      [
        'aging',
        'hours',
        'margins',
        'period',
        'purchases',
        'quotes',
        'revenue',
        'topClients',
      ].sort(),
    );
    const revenue = result.revenue as {
      invoiced: unknown;
      collected: unknown;
      byMonth: { month: string; invoiced: unknown; collected: unknown }[];
    };
    expect(String(revenue.invoiced)).toBe('1210');
    expect(String(revenue.collected)).toBe('605');
    expect(
      revenue.byMonth.map((m) => [
        m.month,
        String(m.invoiced),
        String(m.collected),
      ]),
    ).toEqual([
      ['2026-09', '1210', '0'],
      ['2026-10', '0', '605'],
    ]);
    expect(result.topClients).toEqual([
      expect.objectContaining({ clientId: 3, name: 'SCI Les Acacias' }),
    ]);
    expect(
      String(
        (result.topClients as { collectedPct: unknown }[])[0].collectedPct,
      ),
    ).toBe('50');
    // scope all: no user filter on hours
    expect(timeEntries.sumHoursByDay).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      undefined,
    );
  });

  it('accountant: no hours block (no time_entries right by default)', async () => {
    roles.findRoleById.mockResolvedValue({ id: 7, name: 'accountant' });
    const result = await handler.execute(query, actor);

    expect(result).not.toHaveProperty('hours');
    expect(result).toHaveProperty('revenue');
    expect(result).toHaveProperty('margins');
    expect(timeEntries.sumHoursByDay).not.toHaveBeenCalled();
  });

  it('a block whose module is turned off by an override is left out', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    roles.findOverridesForRole.mockResolvedValue([
      {
        module: 'margins',
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'all',
      },
    ]);
    const result = await handler.execute(query, actor);

    expect(result).not.toHaveProperty('margins');
    expect(margins.findOpenWithBudget).not.toHaveBeenCalled();
  });

  it('scope own on time_entries narrows hours to the user', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    roles.findOverridesForRole.mockResolvedValue([
      {
        module: 'time_entries',
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        scope: 'own',
      },
    ]);
    await handler.execute(query, actor);

    expect(timeEntries.sumHoursByDay).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      9,
    );
    expect(timeEntries.sumHoursByProject).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      5,
      9,
    );
  });

  it('a bad period is refused before any read', async () => {
    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    await expect(
      handler.execute({ from: '2026-10-10', to: '2026-10-01' }, actor),
    ).rejects.toThrow(BadRequestException);
    expect(invoices.invoicedByDay).not.toHaveBeenCalled();
  });
});
