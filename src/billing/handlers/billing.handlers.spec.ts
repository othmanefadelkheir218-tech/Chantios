import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { addOneMonth } from '../../common/helpers/billing-period.helper';
import { NotificationsService } from '../../notifications/notifications.service';
import { PlansService } from '../../plans/plans.service';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UsageCounterHelper } from '../helpers/usage-counter.helper';
import { ApplyPendingPlanIfDueHandler } from './apply-pending-plan-if-due.handler';
import { CountUsageHandler } from './count-usage.handler';
import { RequestDowngradeHandler } from './request-downgrade.handler';
import { BlockExpiredGraceHandler } from './block-expired-grace.handler';
import { RunRenewalHandler } from './run-renewal.handler';
import { TenantVatHandler } from './tenant-vat.handler';
import { TrialReminderHandler } from './trial-reminder.handler';

const plan = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Pro',
  basePrice: '50.00',
  isActive: true,
  isDefault: false,
  stripePriceId: 'price_1',
  features: [
    { featureKey: 'max_workers', limitValue: 5, overageRate: '2.00' },
    { featureKey: 'max_managers', limitValue: 2, overageRate: '5.00' },
    { featureKey: 'max_clients', limitValue: 50, overageRate: '0.20' },
    { featureKey: 'max_subcontractors', limitValue: 20, overageRate: '0.20' },
    { featureKey: 'storage_gb', limitValue: 20, overageRate: '0.50' },
    { featureKey: 'retention_days', limitValue: 365, overageRate: '9.99' },
  ],
  ...over,
});

const subscription = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: 7,
  planId: 1,
  stripeCustomerId: 'cus_1',
  status: 'active',
  periodStart: new Date('2026-01-01T00:00:00Z'),
  periodEnd: new Date('2026-02-01T00:00:00Z'),
  pendingPlanId: null,
  pendingPlanEffectiveAt: null,
  ...over,
});

describe('RunRenewalHandler / RequestDowngradeHandler (step 14)', () => {
  const subscriptions = {
    findByTenant: jest.fn(),
    snapshotUsage: jest.fn(),
    setPeriod: jest.fn(),
    changePlan: jest.fn(),
    startGrace: jest.fn(),
    setStatus: jest.fn(),
  };
  const notifications = { dispatch: jest.fn() };
  const plans = { findOne: jest.fn() };
  const stripe = { pushOverageInvoiceItem: jest.fn() };
  const countUsage = { execute: jest.fn() };
  const usageCounter = { countAll: jest.fn() };
  const applyPendingPlan = { execute: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let runRenewal: RunRenewalHandler;
  let requestDowngrade: RequestDowngradeHandler;
  let trialReminder: TrialReminderHandler;
  let blockGrace: BlockExpiredGraceHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      RunRenewalHandler,
      RequestDowngradeHandler,
      TrialReminderHandler,
      BlockExpiredGraceHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: SubscriptionsService, useValue: subscriptions },
        { provide: PlansService, useValue: plans },
        { provide: StripeService, useValue: stripe },
        { provide: CountUsageHandler, useValue: countUsage },
        { provide: UsageCounterHelper, useValue: usageCounter },
        { provide: ApplyPendingPlanIfDueHandler, useValue: applyPendingPlan },
        { provide: NotificationsService, useValue: notifications },
        // Step 27: no TVA here (the TVA tests are in card-payment / tax-sync specs).
        {
          provide: TenantVatHandler,
          useValue: {
            execute: () =>
              Promise.resolve({ kind: 'missing', reason: 'no_country' }),
          },
        },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    runRenewal = module.get(RunRenewalHandler);
    requestDowngrade = module.get(RequestDowngradeHandler);
    trialReminder = module.get(TrialReminderHandler);
    blockGrace = module.get(BlockExpiredGraceHandler);
  });

  describe('End of the trial (step 20)', () => {
    const NOW = new Date('2026-10-11T10:00:00Z');

    it('renewal of a trialing subscription ends the trial + trial_ended alert', async () => {
      subscriptions.findByTenant.mockResolvedValue(
        subscription({ status: 'trialing' }),
      );
      plans.findOne.mockResolvedValue(plan());
      countUsage.execute.mockResolvedValue({});
      subscriptions.startGrace.mockResolvedValue(
        new Date('2026-02-08T00:00:00Z'),
      );
      await runRenewal.execute(7);
      expect(subscriptions.startGrace).toHaveBeenCalledWith(
        7,
        new Date('2026-02-01T00:00:00Z'),
      );
      expect(notifications.dispatch).toHaveBeenCalledWith('trial_ended', {
        tenantId: 7,
        payload: { entity_id: 7, grace_ends_at: '2026-02-08' },
      });
    });

    it('renewal of an active subscription does not touch the trial', async () => {
      subscriptions.findByTenant.mockResolvedValue(subscription());
      plans.findOne.mockResolvedValue(plan());
      countUsage.execute.mockResolvedValue({});
      await runRenewal.execute(7);
      expect(subscriptions.startGrace).not.toHaveBeenCalled();
    });

    it('a cancelled (blocked) company is skipped: no snapshot, no period move', async () => {
      subscriptions.findByTenant.mockResolvedValue(
        subscription({ status: 'cancelled' }),
      );
      const result = await runRenewal.execute(7);
      expect(result.skipped).toBe(true);
      expect(subscriptions.snapshotUsage).not.toHaveBeenCalled();
      expect(subscriptions.setPeriod).not.toHaveBeenCalled();
    });

    it('day 11: reminder when the trial ends within 3 days, once (dedupe)', async () => {
      subscriptions.findByTenant.mockResolvedValue(
        subscription({
          status: 'trialing',
          periodEnd: new Date('2026-10-14T10:00:00Z'),
        }),
      );
      expect(await trialReminder.execute(7, NOW)).toBe(true);
      expect(notifications.dispatch).toHaveBeenCalledWith('trial_ending', {
        tenantId: 7,
        dedupeDays: 14,
        payload: { entity_id: 7, trial_end: '2026-10-14' },
      });
    });

    it('no reminder 4 days before, nor for an active company', async () => {
      subscriptions.findByTenant.mockResolvedValue(
        subscription({
          status: 'trialing',
          periodEnd: new Date('2026-10-15T11:00:00Z'),
        }),
      );
      expect(await trialReminder.execute(7, NOW)).toBe(false);
      subscriptions.findByTenant.mockResolvedValue(
        subscription({ periodEnd: new Date('2026-10-13T10:00:00Z') }),
      );
      expect(await trialReminder.execute(7, NOW)).toBe(false);
      expect(notifications.dispatch).not.toHaveBeenCalled();
    });

    it('grace over (trial or failed payment) → cancelled + subscription_blocked', async () => {
      subscriptions.findByTenant.mockResolvedValue(
        subscription({
          status: 'past_due',
          graceEndsAt: new Date('2026-10-11T09:00:00Z'),
        }),
      );
      expect(await blockGrace.execute(7, NOW)).toBe(true);
      expect(subscriptions.setStatus).toHaveBeenCalledWith(7, 'cancelled');
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'subscription_blocked',
        {
          tenantId: 7,
          payload: { entity_id: 7 },
        },
      );
    });

    it('no block before the grace date, nor for a failed payment (no grace date)', async () => {
      subscriptions.findByTenant.mockResolvedValue(
        subscription({
          status: 'past_due',
          graceEndsAt: new Date('2026-10-12T09:00:00Z'),
        }),
      );
      expect(await blockGrace.execute(7, NOW)).toBe(false);
      subscriptions.findByTenant.mockResolvedValue(
        subscription({ status: 'past_due', graceEndsAt: null }),
      );
      expect(await blockGrace.execute(7, NOW)).toBe(false);
      expect(subscriptions.setStatus).not.toHaveBeenCalled();
    });
  });

  describe('RunRenewalHandler — the renewal math', () => {
    const usage = {
      max_workers: 7,
      max_managers: 2,
      max_clients: 50,
      max_subcontractors: 20,
      storage_gb: 21.5,
    };

    beforeEach(() => {
      subscriptions.findByTenant.mockResolvedValue(subscription());
      plans.findOne.mockResolvedValue(plan());
      countUsage.execute.mockResolvedValue(usage);
      subscriptions.snapshotUsage.mockResolvedValue(undefined);
      subscriptions.setPeriod.mockResolvedValue(undefined);
      applyPendingPlan.execute.mockResolvedValue(undefined);
    });

    it('sums the overage of every billed feature except retention_days', async () => {
      const result = await runRenewal.execute(7);

      // 2 extra workers @ 2.00 = 4.00; storage 1.5 over @ 0.50 = 0.75; rest at/under allowance.
      expect(result.totalOverage).toBe('4.75');
    });

    it('skips a feature present on the plan but missing from the usage map, instead of crashing on it', async () => {
      // `computeOverageAmount` builds a `Prisma.Decimal` from the actual
      // count — handing it `undefined` throws a DecimalError. So a plan
      // feature with no matching key in the usage map must be skipped
      // (`if (actual === undefined) continue`), never treated as a literal 0.
      countUsage.execute.mockResolvedValue({
        max_workers: 7,
        // max_managers, max_clients, max_subcontractors, storage_gb all absent
      });

      const result = await runRenewal.execute(7);

      // Only max_workers contributes: 2 extra @ 2.00 = 4.00.
      expect(new Prisma.Decimal(result.totalOverage).toFixed(2)).toBe('4.00');
    });

    it('calls snapshotUsage once with the full usage map and the CURRENT (pre-roll) period', async () => {
      await runRenewal.execute(7);

      expect(subscriptions.snapshotUsage).toHaveBeenCalledTimes(1);
      expect(subscriptions.snapshotUsage).toHaveBeenCalledWith({
        tenantId: 7,
        periodStart: new Date('2026-01-01T00:00:00Z'),
        periodEnd: new Date('2026-02-01T00:00:00Z'),
        usage,
      });
    });

    it('pushes the overage to Stripe when the total is above zero', async () => {
      await runRenewal.execute(7);

      expect(stripe.pushOverageInvoiceItem).toHaveBeenCalledTimes(1);
      const [customerId, amount, , idempotencyKey] = stripe
        .pushOverageInvoiceItem.mock.calls[0] as [
        string,
        Prisma.Decimal,
        string,
        string,
      ];
      expect(customerId).toBe('cus_1');
      expect(amount.toFixed(2)).toBe('4.75');
      expect(idempotencyKey).toBe(
        `overage:7:${new Date('2026-01-01T00:00:00Z').toISOString()}`,
      );
    });

    it('never calls Stripe when the total overage is exactly zero', async () => {
      countUsage.execute.mockResolvedValue({
        max_workers: 5,
        max_managers: 2,
        max_clients: 50,
        max_subcontractors: 20,
        storage_gb: 20,
      });

      await runRenewal.execute(7);

      expect(stripe.pushOverageInvoiceItem).not.toHaveBeenCalled();
    });

    it('rolls period_start/period_end forward, the OLD period_end becoming the new period_start', async () => {
      await runRenewal.execute(7);

      const oldPeriodEnd = new Date('2026-02-01T00:00:00Z');
      expect(subscriptions.setPeriod).toHaveBeenCalledWith(
        7,
        oldPeriodEnd,
        addOneMonth(oldPeriodEnd),
      );
    });

    it('applies a pending plan using the new period start as "now"', async () => {
      await runRenewal.execute(7);

      const sub = subscription();
      const newPeriodStart = sub.periodEnd;
      expect(applyPendingPlan.execute).toHaveBeenCalledWith(
        7,
        sub,
        newPeriodStart,
      );
    });
  });

  describe('RequestDowngradeHandler — the storage gate', () => {
    it('a target plan with an equal storage limit skips the usage check entirely', async () => {
      subscriptions.findByTenant.mockResolvedValue(subscription({ planId: 1 }));
      plans.findOne
        .mockResolvedValueOnce(plan({ id: 1 })) // current
        .mockResolvedValueOnce(plan({ id: 2 })); // target, same storage_gb: 20
      subscriptions.changePlan.mockResolvedValue({ tenantId: 7 });

      await requestDowngrade.execute(7, { plan_id: 2 });

      expect(usageCounter.countAll).not.toHaveBeenCalled();
      expect(subscriptions.changePlan).toHaveBeenCalledWith(7, { plan_id: 2 });
    });

    it('a target plan with a LARGER storage limit also skips the usage check', async () => {
      subscriptions.findByTenant.mockResolvedValue(subscription({ planId: 1 }));
      plans.findOne
        .mockResolvedValueOnce(plan({ id: 1 })) // current: storage_gb 20
        .mockResolvedValueOnce(
          plan({
            id: 3,
            features: [
              { featureKey: 'storage_gb', limitValue: 50, overageRate: '0.50' },
            ],
          }),
        );
      subscriptions.changePlan.mockResolvedValue({ tenantId: 7 });

      await requestDowngrade.execute(7, { plan_id: 3 });

      expect(usageCounter.countAll).not.toHaveBeenCalled();
      expect(subscriptions.changePlan).toHaveBeenCalledWith(7, { plan_id: 3 });
    });

    it('a smaller target limit with usage still above it is refused, changePlan never called', async () => {
      subscriptions.findByTenant.mockResolvedValue(subscription({ planId: 1 }));
      const small = plan({
        id: 4,
        features: [
          { featureKey: 'storage_gb', limitValue: 10, overageRate: '0.50' },
        ],
      });
      plans.findOne
        .mockResolvedValueOnce(plan({ id: 1 }))
        .mockResolvedValueOnce(small);
      usageCounter.countAll.mockResolvedValue({ storage_gb: 15.2 });

      let caught: unknown;
      try {
        await requestDowngrade.execute(7, { plan_id: 4 });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(BadRequestException);
      expect((caught as BadRequestException).message).toContain('15.2');
      expect((caught as BadRequestException).message).toContain('10');
      expect(subscriptions.changePlan).not.toHaveBeenCalled();
    });

    it('a smaller target limit with usage already at or below it proceeds to changePlan', async () => {
      subscriptions.findByTenant.mockResolvedValue(subscription({ planId: 1 }));
      const small = plan({
        id: 4,
        features: [
          { featureKey: 'storage_gb', limitValue: 10, overageRate: '0.50' },
        ],
      });
      plans.findOne
        .mockResolvedValueOnce(plan({ id: 1 }))
        .mockResolvedValueOnce(small);
      usageCounter.countAll.mockResolvedValue({ storage_gb: 10 });
      subscriptions.changePlan.mockResolvedValue({ tenantId: 7 });

      await requestDowngrade.execute(7, { plan_id: 4 });

      expect(subscriptions.changePlan).toHaveBeenCalledWith(7, { plan_id: 4 });
    });

    it("an unknown target plan id lets plans.findOne's own 404 propagate", async () => {
      subscriptions.findByTenant.mockResolvedValue(subscription({ planId: 1 }));
      plans.findOne
        .mockResolvedValueOnce(plan({ id: 1 }))
        .mockRejectedValueOnce(new NotFoundException('Plan not found'));

      await expect(
        requestDowngrade.execute(7, { plan_id: 999 }),
      ).rejects.toThrow(NotFoundException);
      expect(subscriptions.changePlan).not.toHaveBeenCalled();
    });
  });
});

describe('ApplyPendingPlanIfDueHandler (billing) — only once the effective date has passed', () => {
  const subscriptions = { applyPendingPlan: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let applyPendingPlan: ApplyPendingPlanIfDueHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ApplyPendingPlanIfDueHandler,
        { provide: SubscriptionsService, useValue: subscriptions },
        {
          provide: getLoggerToken(ApplyPendingPlanIfDueHandler.name),
          useValue: logger,
        },
      ],
    }).compile();

    applyPendingPlan = module.get(ApplyPendingPlanIfDueHandler);
  });

  it('is a no-op when nothing is pending', async () => {
    const sub = subscription({
      pendingPlanId: null,
      pendingPlanEffectiveAt: null,
    });
    await applyPendingPlan.execute(
      7,
      sub as never,
      new Date('2026-02-01T00:00:00Z'),
    );
    expect(subscriptions.applyPendingPlan).not.toHaveBeenCalled();
  });

  it('applies the pending plan when the effective date equals now (boundary is due)', async () => {
    const now = new Date('2026-02-01T00:00:00Z');
    const sub = subscription({ pendingPlanId: 2, pendingPlanEffectiveAt: now });
    await applyPendingPlan.execute(7, sub as never, now);
    expect(subscriptions.applyPendingPlan).toHaveBeenCalledWith(7);
  });

  it('applies the pending plan when the effective date is in the past', async () => {
    const sub = subscription({
      pendingPlanId: 2,
      pendingPlanEffectiveAt: new Date('2026-01-15T00:00:00Z'),
    });
    await applyPendingPlan.execute(
      7,
      sub as never,
      new Date('2026-02-01T00:00:00Z'),
    );
    expect(subscriptions.applyPendingPlan).toHaveBeenCalledWith(7);
  });

  it('skips when the effective date is still in the future', async () => {
    const sub = subscription({
      pendingPlanId: 2,
      pendingPlanEffectiveAt: new Date('2026-03-01T00:00:00Z'),
    });
    await applyPendingPlan.execute(
      7,
      sub as never,
      new Date('2026-02-01T00:00:00Z'),
    );
    expect(subscriptions.applyPendingPlan).not.toHaveBeenCalled();
  });
});
