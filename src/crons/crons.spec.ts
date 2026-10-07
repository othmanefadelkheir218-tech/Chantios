import { callArg, containing } from '../common/testing/spec-helpers';
import { EndOfDayReminderCron } from './end-of-day-reminder.cron';
import {
  addDays,
  isReminderHour,
  localMoment,
  reminderHourOf,
} from './helpers/tenant-local-time.helper';
import { MissingTimesheetCron } from './missing-timesheet.cron';
import { PurchaseDueCron } from './purchase-due.cron';
import { RetentionCron } from './retention.cron';
import { StalledProjectCron } from './stalled-project.cron';
import { TaskStartingCron } from './task-starting.cron';
import { TenantRunner } from './tenant-runner.service';
import {
  USAGE_SPIKE_STORAGE_THRESHOLD,
  UsageSpikeCron,
} from './usage-spike.cron';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

const at = (time: string) => new Date(`1970-01-01T${time}Z`);

const tenant = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Dupont',
  timezone: 'Europe/Brussels',
  endOfDayReminderTime: at('18:00:00'),
  locale: 'fr',
  ...over,
});

/** A runner that walks a fixed list of tenants and records the tenant context. */
const runnerOf = (tenants: Array<ReturnType<typeof tenant>>) =>
  ({
    forEachTenant: jest.fn(
      async (_job: string, work: (t: unknown) => Promise<void>) => {
        for (const t of tenants) await work(t);
        return tenants.length;
      },
    ),
  }) as unknown as TenantRunner;

describe('tenant-local-time.helper', () => {
  it('reads the wall clock of a timezone (winter: Brussels = UTC+1)', () => {
    expect(
      localMoment(new Date('2026-01-15T17:30:00Z'), 'Europe/Brussels'),
    ).toEqual({ date: '2026-01-15', hour: 18, minute: 30 });
  });

  it('daylight saving is respected (summer: Brussels = UTC+2)', () => {
    expect(
      localMoment(new Date('2026-07-15T16:30:00Z'), 'Europe/Brussels'),
    ).toEqual({ date: '2026-07-15', hour: 18, minute: 30 });
  });

  it('the LOCAL date can differ from the UTC date', () => {
    expect(
      localMoment(new Date('2026-03-10T23:30:00Z'), 'Asia/Tokyo').date,
    ).toBe('2026-03-11');
    expect(
      localMoment(new Date('2026-03-10T02:00:00Z'), 'America/New_York').date,
    ).toBe('2026-03-09');
  });

  it('an unknown timezone falls back to UTC instead of crashing the cron', () => {
    expect(localMoment(new Date('2026-01-15T17:30:00Z'), 'Mars/Base')).toEqual({
      date: '2026-01-15',
      hour: 17,
      minute: 30,
    });
  });

  it('reads the hour of a Postgres time column', () => {
    expect(reminderHourOf(at('18:00:00'))).toBe(18);
    expect(reminderHourOf(at('07:45:00'))).toBe(7);
  });

  it('isReminderHour: the local hour must equal the reminder hour', () => {
    const winterBrussels18 = new Date('2026-01-15T17:10:00Z');
    expect(
      isReminderHour(winterBrussels18, 'Europe/Brussels', at('18:00:00')),
    ).toBe(true);
    expect(
      isReminderHour(winterBrussels18, 'Europe/Brussels', at('19:00:00')),
    ).toBe(false);
    // the SAME instant is 12:10 in New York
    expect(
      isReminderHour(winterBrussels18, 'America/New_York', at('18:00:00')),
    ).toBe(false);
  });

  it('isReminderHour with an offset (the manager alert, one hour later)', () => {
    const brussels19 = new Date('2026-01-15T18:05:00Z');
    expect(
      isReminderHour(brussels19, 'Europe/Brussels', at('18:00:00'), 1),
    ).toBe(true);
    expect(
      isReminderHour(brussels19, 'Europe/Brussels', at('18:00:00'), 0),
    ).toBe(false);
    // 23:00 + 1 wraps to 00:00
    expect(
      isReminderHour(
        new Date('2026-01-15T23:10:00Z'),
        'UTC',
        at('23:00:00'),
        1,
      ),
    ).toBe(false);
    expect(
      isReminderHour(
        new Date('2026-01-16T00:10:00Z'),
        'UTC',
        at('23:00:00'),
        1,
      ),
    ).toBe(true);
  });

  it('addDays does calendar arithmetic across month and year ends', () => {
    expect(addDays('2026-10-07', 1)).toBe('2026-10-08');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('EndOfDayReminderCron — each company at its OWN local time', () => {
  const timeEntries = { findUserIdsWithHoursOn: jest.fn() };
  const users = { findActiveWithRole: jest.fn() };
  const notifications = { dispatch: jest.fn() };

  const cronFor = (tenants: Array<ReturnType<typeof tenant>>) =>
    new EndOfDayReminderCron(
      logger as never,
      runnerOf(tenants),
      users as never,
      timeEntries as never,
      notifications as never,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    users.findActiveWithRole.mockResolvedValue([
      { id: 10, roleName: 'worker' },
      { id: 11, roleName: 'worker' },
      { id: 12, roleName: 'manager' },
    ]);
    timeEntries.findUserIdsWithHoursOn.mockResolvedValue([11]);
  });

  it('18:00 in Brussels: only the workers with no hours get the reminder', async () => {
    const result = await cronFor([tenant()]).run(
      new Date('2026-01-15T17:05:00Z'),
    );
    expect(result).toEqual({ reminders: 1 });
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'end_of_day_reminder',
      expect.objectContaining({ tenantId: 1, userIds: [10] }),
    );
    // today means the company's LOCAL date
    expect(timeEntries.findUserIdsWithHoursOn).toHaveBeenCalledWith(
      new Date('2026-01-15T00:00:00Z'),
    );
  });

  it('a manager is never reminded (only workers log hours daily)', async () => {
    await cronFor([tenant()]).run(new Date('2026-01-15T17:05:00Z'));
    const context = callArg<{ userIds: number[] }>(
      notifications.dispatch,
      0,
      1,
    );
    expect(context.userIds).not.toContain(12);
  });

  it('two tenants with different times and timezones: each fires at its own local hour', async () => {
    const brussels = tenant({ id: 1 });
    const newYork = tenant({
      id: 2,
      timezone: 'America/New_York',
      endOfDayReminderTime: at('17:00:00'),
    });
    const cron = cronFor([brussels, newYork]);

    // 17:05 UTC in winter = 18:05 Brussels (fires) and 12:05 New York (silent)
    await cron.run(new Date('2026-01-15T17:05:00Z'));
    expect(
      notifications.dispatch.mock.calls.map(
        (call: unknown[]) => (call[1] as { tenantId: number }).tenantId,
      ),
    ).toEqual([1]);

    // 22:05 UTC = 23:05 Brussels (silent) and 17:05 New York (fires)
    notifications.dispatch.mockClear();
    await cron.run(new Date('2026-01-15T22:05:00Z'));
    expect(
      notifications.dispatch.mock.calls.map(
        (call: unknown[]) => (call[1] as { tenantId: number }).tenantId,
      ),
    ).toEqual([2]);
  });

  it('a custom reminder time (07:00) is honoured', async () => {
    const early = tenant({ endOfDayReminderTime: at('07:00:00') });
    const cron = cronFor([early]);
    await cron.run(new Date('2026-01-15T17:05:00Z'));
    expect(notifications.dispatch).not.toHaveBeenCalled();
    await cron.run(new Date('2026-01-15T06:05:00Z'));
    expect(notifications.dispatch).toHaveBeenCalledTimes(1);
  });

  it('nobody to remind -> nothing is dispatched', async () => {
    timeEntries.findUserIdsWithHoursOn.mockResolvedValue([10, 11]);
    await cronFor([tenant()]).run(new Date('2026-01-15T17:05:00Z'));
    expect(notifications.dispatch).not.toHaveBeenCalled();
  });

  it('a failure never escapes the cron', async () => {
    users.findActiveWithRole.mockRejectedValue(new Error('db down'));
    const failing = {
      forEachTenant: jest.fn().mockRejectedValue(new Error('db down')),
    };
    const cron = new EndOfDayReminderCron(
      logger as never,
      failing as never,
      users as never,
      timeEntries as never,
      notifications as never,
    );
    await expect(cron.run()).resolves.toEqual({ reminders: 0 });
  });
});

describe('MissingTimesheetCron', () => {
  const timeEntries = { findMissingTimesheets: jest.fn() };
  const notifications = { dispatch: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    timeEntries.findMissingTimesheets.mockResolvedValue([
      { userId: 10, userName: 'Omar' },
    ]);
  });

  const cron = () =>
    new MissingTimesheetCron(
      logger as never,
      runnerOf([tenant()]),
      timeEntries as never,
      notifications as never,
    );

  it('fires ONE hour after the reminder time (19:xx for an 18:00 company)', async () => {
    await cron().run(new Date('2026-01-15T17:05:00Z')); // 18:05 local
    expect(notifications.dispatch).not.toHaveBeenCalled();

    await cron().run(new Date('2026-01-15T18:05:00Z')); // 19:05 local
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'missing_timesheet',
      expect.objectContaining({
        tenantId: 1,
        dedupeDays: 1,
        payload: containing({
          entity_id: 10,
          employee_name: 'Omar',
          date: '2026-01-15',
        }),
      }),
    );
  });
});

describe('StalledProjectCron', () => {
  it('alerts for each stalled project with the 5-day window', async () => {
    const timeEntries = {
      findStalledProjects: jest
        .fn()
        .mockResolvedValue([{ projectId: 7, projectName: 'Site A' }]),
    };
    const notifications = { dispatch: jest.fn() };
    const result = await new StalledProjectCron(
      logger as never,
      runnerOf([tenant()]),
      timeEntries as never,
      notifications as never,
    ).run();
    expect(result).toEqual({ alerts: 1 });
    expect(timeEntries.findStalledProjects).toHaveBeenCalledWith(5, 1);
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'stalled_project',
      expect.objectContaining({
        dedupeDays: 5,
        payload: containing({
          entity_id: 7,
          project_name: 'Site A',
          days: 5,
        }),
      }),
    );
  });
});

describe('PurchaseDueCron', () => {
  it('raises purchase_due for each bill due within 7 days, repeated at most every 3 days', async () => {
    const purchaseInvoices = {
      dueSoon: jest
        .fn()
        .mockResolvedValue([
          { id: 4, number: 'PI-4', dueDate: new Date('2026-10-10T00:00:00Z') },
        ]),
    };
    const notifications = { dispatch: jest.fn() };
    const result = await new PurchaseDueCron(
      logger as never,
      runnerOf([tenant()]),
      purchaseInvoices as never,
      notifications as never,
    ).run();
    expect(result).toEqual({ alerts: 1 });
    expect(purchaseInvoices.dueSoon).toHaveBeenCalledWith(7);
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'purchase_due',
      expect.objectContaining({
        tenantId: 1,
        dedupeDays: 3,
        payload: containing({
          entity_id: 4,
          invoice_ref: 'PI-4',
          due_date: '2026-10-10',
        }),
      }),
    );
  });
});

describe('TaskStartingCron', () => {
  it("looks for the company's tomorrow and tells the assignees", async () => {
    const tasks = {
      findStartingOn: jest.fn().mockResolvedValue([
        {
          id: 3,
          title: 'Paint',
          assignees: [{ userId: 10 }, { userId: 11 }],
          project: { name: 'Site A' },
        },
        { id: 4, title: 'Nobody', assignees: [], project: { name: 'Site A' } },
      ]),
    };
    const notifications = { dispatch: jest.fn() };
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T13:00:00Z'));
    try {
      const result = await new TaskStartingCron(
        logger as never,
        runnerOf([tenant()]),
        tasks as never,
        notifications as never,
      ).run();
      expect(result).toEqual({ alerts: 1 });
    } finally {
      jest.useRealTimers();
    }
    expect(tasks.findStartingOn).toHaveBeenCalledWith(
      new Date('2026-10-08T00:00:00Z'),
    );
    expect(notifications.dispatch).toHaveBeenCalledTimes(1);
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'task_starting',
      expect.objectContaining({
        userIds: [10, 11],
        dedupeDays: 2,
        payload: containing({
          entity_id: 3,
          task_title: 'Paint',
          start_date: '2026-10-08',
        }),
      }),
    );
  });
});

describe('RetentionCron — only read notifications and analytics events', () => {
  const subscriptions = { findByTenant: jest.fn() };
  const plans = { findOne: jest.fn() };
  const notifications = { purgeReadBefore: jest.fn() };
  const analytics = { purgeBefore: jest.fn() };
  const NOW = new Date('2026-10-07T03:30:00Z');

  const cron = () =>
    new RetentionCron(
      logger as never,
      runnerOf([tenant()]),
      subscriptions as never,
      plans as never,
      notifications as never,
      analytics as never,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    subscriptions.findByTenant.mockResolvedValue({ planId: 2 });
    notifications.purgeReadBefore.mockResolvedValue(3);
    analytics.purgeBefore.mockResolvedValue(5);
  });

  it('cuts off retention_days before now, for both tables', async () => {
    plans.findOne.mockResolvedValue({
      features: [
        { featureKey: 'max_workers', limitValue: 10 },
        { featureKey: 'retention_days', limitValue: 365 },
      ],
    });
    const result = await cron().run(NOW);
    expect(result).toEqual({ notifications: 3, events: 5 });
    const expected = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(notifications.purgeReadBefore).toHaveBeenCalledWith(1, expected);
    expect(analytics.purgeBefore).toHaveBeenCalledWith(1, expected);
  });

  it('retention_days = 0 keeps everything', async () => {
    plans.findOne.mockResolvedValue({
      features: [{ featureKey: 'retention_days', limitValue: 0 }],
    });
    await cron().run(NOW);
    expect(notifications.purgeReadBefore).not.toHaveBeenCalled();
    expect(analytics.purgeBefore).not.toHaveBeenCalled();
  });

  it('a plan with no retention feature keeps everything', async () => {
    plans.findOne.mockResolvedValue({ features: [] });
    await cron().run(NOW);
    expect(notifications.purgeReadBefore).not.toHaveBeenCalled();
  });
});

describe('UsageSpikeCron — storage only, 90% of the plan allowance', () => {
  const subscriptions = { findByTenant: jest.fn() };
  const plans = { findOne: jest.fn() };
  const usageCounter = { countAll: jest.fn() };
  const notifications = { dispatch: jest.fn() };

  const cron = () =>
    new UsageSpikeCron(
      logger as never,
      runnerOf([tenant()]),
      usageCounter as never,
      subscriptions as never,
      plans as never,
      notifications as never,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    subscriptions.findByTenant.mockResolvedValue({ planId: 2 });
    plans.findOne.mockResolvedValue({
      features: [{ featureKey: 'storage_gb', limitValue: 20 }],
    });
  });

  it('the named constant is 0.9 (90%)', () => {
    expect(USAGE_SPIKE_STORAGE_THRESHOLD).toBe(0.9);
  });

  it('fires right AT the threshold (18/20 = exactly 90%)', async () => {
    usageCounter.countAll.mockResolvedValue({ storage_gb: 18 });
    const result = await cron().run();
    expect(result).toEqual({ alerts: 1 });
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'usage_spike',
      expect.objectContaining({
        payload: containing({
          tenant_id: 1,
          company_name: 'Dupont',
          metric: 'storage',
          storage_gb: 18,
          limit_gb: 20,
        }),
      }),
    );
  });

  it('just under the threshold does not fire (17.9/20 = 89.5%)', async () => {
    usageCounter.countAll.mockResolvedValue({ storage_gb: 17.9 });
    const result = await cron().run();
    expect(result).toEqual({ alerts: 0 });
    expect(notifications.dispatch).not.toHaveBeenCalled();
  });

  it('a plan with no storage_gb feature is skipped, never a divide-by-zero', async () => {
    plans.findOne.mockResolvedValue({ features: [] });
    usageCounter.countAll.mockResolvedValue({ storage_gb: 999 });
    const result = await cron().run();
    expect(result).toEqual({ alerts: 0 });
    expect(usageCounter.countAll).not.toHaveBeenCalled();
    expect(notifications.dispatch).not.toHaveBeenCalled();
  });

  it('does not pass dedupeDays — platform alerts have no dedup today (toPlatform never calls dropRecentlyNotified)', async () => {
    usageCounter.countAll.mockResolvedValue({ storage_gb: 20 });
    await cron().run();
    const call = callArg<Record<string, unknown>>(notifications.dispatch, 0, 1);
    expect(call.dedupeDays).toBeUndefined();
  });
});

describe('TenantRunner', () => {
  it('one failing company is logged and skipped, the others still run', async () => {
    const tenants = {
      findAllActive: jest
        .fn()
        .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]),
    };
    const contextIds: number[] = [];
    const tenantContext = {
      setTenantId: (id: number) => contextIds.push(id),
    };
    const cls = { run: (fn: () => Promise<void>) => fn() };
    const runner = new TenantRunner(
      logger as never,
      tenants as never,
      cls as never,
      tenantContext as never,
    );
    const seen: number[] = [];
    const done = await runner.forEachTenant('test', (t) => {
      if (t.id === 2) return Promise.reject(new Error('boom'));
      seen.push(t.id);
      return Promise.resolve();
    });
    expect(seen).toEqual([1, 3]);
    expect(done).toBe(2);
    // each company was put in the context before its work ran
    expect(contextIds).toEqual([1, 2, 3]);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
