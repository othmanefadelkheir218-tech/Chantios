import type { PinoLogger } from 'nestjs-pino';
import type { FeedbackService } from '../../feedback/feedback.service';
import type { PlansService } from '../../plans/plans.service';
import type { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import type { SupportService } from '../../support/support.service';
import type { TenantsService } from '../../tenants/tenants.service';
import { lastMonths } from '../helpers/stats-months.helper';
import { GetAdminStatsHandler } from './get-admin-stats.handler';

// doc/notes/admin-stats.md

describe('lastMonths', () => {
  it('gives 12 months, oldest first, the current Brussels month last', () => {
    const { months, since } = lastMonths(new Date('2026-10-11T10:00:00Z'));
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2025-11');
    expect(months[11]).toBe('2026-10');
    expect(since.toISOString().slice(0, 10)).toBe('2025-10-31');
  });

  it('uses Brussels time: 31 Dec 23:30 UTC is already January', () => {
    const { months } = lastMonths(new Date('2026-12-31T23:30:00Z'));
    expect(months[11]).toBe('2027-01');
    expect(months[0]).toBe('2026-02');
  });
});

describe('GetAdminStatsHandler', () => {
  const logger = { debug: jest.fn() } as unknown as PinoLogger;
  const tenants = {
    countByStatus: jest.fn().mockResolvedValue([
      { status: 'active', count: 9 },
      { status: 'suspended', count: 1 },
    ]),
    countCreatedPerMonth: jest.fn().mockResolvedValue([
      { month: '2025-10', count: 5 }, // before the window: ignored
      { month: '2026-09', count: 2 },
      { month: '2026-10', count: 3 },
    ]),
  };
  const subscriptions = {
    countByStatus: jest.fn().mockResolvedValue([
      { status: 'trialing', count: 4 },
      { status: 'active', count: 6 },
    ]),
    countByPlan: jest.fn().mockResolvedValue([
      { planId: 1, count: 2 },
      { planId: 2, count: 5 },
      { planId: 3, count: 1 }, // old version of plan 2
    ]),
  };
  const plans = {
    findNames: jest.fn().mockResolvedValue([
      { id: 1, name: 'Starter' },
      { id: 2, name: 'Pro' },
      { id: 3, name: 'Pro' },
    ]),
  };
  const support = {
    countOpenForAdmin: jest
      .fn()
      .mockResolvedValue({ open: 4, highPriority: 1 }),
  };
  const feedback = { countByStatus: jest.fn().mockResolvedValue(2) };

  const handler = new GetAdminStatsHandler(
    logger,
    tenants as unknown as TenantsService,
    subscriptions as unknown as SubscriptionsService,
    plans as unknown as PlansService,
    support as unknown as SupportService,
    feedback as unknown as FeedbackService,
  );

  it('shapes every number from the owning services', async () => {
    const stats = await handler.execute(new Date('2026-10-11T10:00:00Z'));

    expect(stats.tenants).toEqual({
      total: 10,
      active: 9,
      suspended: 1,
      banned: 0,
    });
    expect(stats.subscriptions).toEqual({
      trialing: 4,
      active: 6,
      past_due: 0,
      cancelled: 0,
    });
    expect(stats.support).toEqual({ open: 4, highPriority: 1 });
    expect(stats.feedback).toEqual({ new: 2 });
    expect(feedback.countByStatus).toHaveBeenCalledWith('new');
  });

  it('fills the 12 months, empty months at 0, rows outside dropped', async () => {
    const { growth } = await handler.execute(new Date('2026-10-11T10:00:00Z'));
    expect(growth).toHaveLength(12);
    expect(growth[0]).toEqual({ month: '2025-11', newTenants: 0 });
    expect(growth[10]).toEqual({ month: '2026-09', newTenants: 2 });
    expect(growth[11]).toEqual({ month: '2026-10', newTenants: 3 });
  });

  it('adds old plan versions to their plan name, biggest first', async () => {
    const { planSplit } = await handler.execute(
      new Date('2026-10-11T10:00:00Z'),
    );
    expect(planSplit).toEqual([
      { planName: 'Pro', tenants: 6 },
      { planName: 'Starter', tenants: 2 },
    ]);
  });
});
