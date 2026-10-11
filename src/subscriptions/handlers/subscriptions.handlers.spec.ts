import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { ApplyPendingPlanHandler } from './apply-pending-plan.handler';
import { StartGraceHandler } from './start-grace.handler';
import { ShiftDatesHandler } from './shift-dates.handler';
import { MovePendingPlanDateHandler } from './move-pending-plan-date.handler';
import { SetPeriodHandler } from './set-period.handler';
import { SetStatusHandler } from './set-status.handler';

describe('Subscriptions handlers (step 14 additions)', () => {
  const repo = {
    applyPendingPlan: jest.fn(),
    setStatusAndGrace: jest.fn(),
    setPeriod: jest.fn(),
    movePendingPlanDate: jest.fn(),
    findByTenant: jest.fn(),
    setDates: jest.fn(),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let applyPendingPlan: ApplyPendingPlanHandler;
  let setStatus: SetStatusHandler;
  let setPeriod: SetPeriodHandler;
  let movePendingPlanDate: MovePendingPlanDateHandler;
  let startGrace: StartGraceHandler;
  let shiftDates: ShiftDatesHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      ApplyPendingPlanHandler,
      SetStatusHandler,
      SetPeriodHandler,
      MovePendingPlanDateHandler,
      StartGraceHandler,
      ShiftDatesHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: SubscriptionRepository, useValue: repo },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    applyPendingPlan = module.get(ApplyPendingPlanHandler);
    setStatus = module.get(SetStatusHandler);
    setPeriod = module.get(SetPeriodHandler);
    movePendingPlanDate = module.get(MovePendingPlanDateHandler);
    startGrace = module.get(StartGraceHandler);
    shiftDates = module.get(ShiftDatesHandler);
  });

  describe('StartGraceHandler — 7 days to pay (trial end, failed payment)', () => {
    const from = new Date('2026-10-14T09:00:00Z');

    it('trialing / active → past_due with grace = from + 7 days', async () => {
      repo.findByTenant.mockResolvedValue({
        status: 'trialing',
        graceEndsAt: null,
      });
      await expect(startGrace.execute(7, from)).resolves.toEqual(
        new Date('2026-10-21T09:00:00Z'),
      );
      expect(repo.setStatusAndGrace).toHaveBeenCalledWith(
        7,
        'past_due',
        new Date('2026-10-21T09:00:00Z'),
      );
    });

    it('already past_due with a date: the date is kept, never extended', async () => {
      const existing = new Date('2026-10-16T00:00:00Z');
      repo.findByTenant.mockResolvedValue({
        status: 'past_due',
        graceEndsAt: existing,
      });
      await expect(startGrace.execute(7, from)).resolves.toBe(existing);
      expect(repo.setStatusAndGrace).not.toHaveBeenCalled();
    });

    it('past_due with no date (old failure) gets one', async () => {
      repo.findByTenant.mockResolvedValue({
        status: 'past_due',
        graceEndsAt: null,
      });
      await startGrace.execute(7, from);
      expect(repo.setStatusAndGrace).toHaveBeenCalled();
    });

    it('a blocked company stays blocked: null, nothing written', async () => {
      repo.findByTenant.mockResolvedValue({
        status: 'cancelled',
        graceEndsAt: null,
      });
      await expect(startGrace.execute(7, from)).resolves.toBeNull();
      expect(repo.setStatusAndGrace).not.toHaveBeenCalled();
    });
  });

  describe('ShiftDatesHandler — dev tools', () => {
    it('moves every date N days earlier; a null date stays null', async () => {
      repo.findByTenant.mockResolvedValue({
        periodStart: new Date('2026-10-01T00:00:00Z'),
        periodEnd: new Date('2026-10-15T00:00:00Z'),
        pendingPlanEffectiveAt: null,
        graceEndsAt: new Date('2026-10-22T00:00:00Z'),
      });
      await shiftDates.execute(7, 10);
      expect(repo.setDates).toHaveBeenCalledWith(7, {
        periodStart: new Date('2026-09-21T00:00:00Z'),
        periodEnd: new Date('2026-10-05T00:00:00Z'),
        pendingPlanEffectiveAt: null,
        graceEndsAt: new Date('2026-10-12T00:00:00Z'),
      });
    });

    it('404 for a company with no subscription', async () => {
      repo.findByTenant.mockResolvedValue(null);
      await expect(shiftDates.execute(7, 10)).rejects.toThrow(
        'Subscription not found',
      );
    });
  });

  describe('ApplyPendingPlanHandler — thin passthrough to the repository', () => {
    it('delegates to the repository, which itself is a no-op when nothing is pending', async () => {
      const unchanged = { tenantId: 7, pendingPlanId: null };
      repo.applyPendingPlan.mockResolvedValue(unchanged);

      const result = await applyPendingPlan.execute(7);

      expect(repo.applyPendingPlan).toHaveBeenCalledWith(7, undefined);
      expect(result).toBe(unchanged);
    });

    it('forwards an open transaction client through to the repository', async () => {
      const tx = { marker: 'tx' } as never;
      repo.applyPendingPlan.mockResolvedValue({ tenantId: 7 });

      await applyPendingPlan.execute(7, tx);

      expect(repo.applyPendingPlan).toHaveBeenCalledWith(7, tx);
    });
  });

  describe('SetStatusHandler', () => {
    it('past_due keeps the grace date as it is (undefined = untouched)', async () => {
      await setStatus.execute(7, 'past_due');
      expect(repo.setStatusAndGrace).toHaveBeenCalledWith(
        7,
        'past_due',
        undefined,
        undefined,
      );
    });

    it('any other status clears the grace date, and forwards the transaction', async () => {
      const tx = { marker: 'tx' } as never;
      await setStatus.execute(7, 'cancelled', tx);
      expect(repo.setStatusAndGrace).toHaveBeenCalledWith(
        7,
        'cancelled',
        null,
        tx,
      );
      await setStatus.execute(7, 'active');
      expect(repo.setStatusAndGrace).toHaveBeenLastCalledWith(
        7,
        'active',
        null,
        undefined,
      );
    });
  });

  describe('SetPeriodHandler', () => {
    it('writes the new period bounds for the tenant', async () => {
      const periodStart = new Date('2026-02-01T00:00:00Z');
      const periodEnd = new Date('2026-03-01T00:00:00Z');
      repo.setPeriod.mockResolvedValue({ tenantId: 7, periodStart, periodEnd });

      await setPeriod.execute(7, periodStart, periodEnd);

      expect(repo.setPeriod).toHaveBeenCalledWith(
        7,
        periodStart,
        periodEnd,
        undefined,
      );
    });

    it('forwards an open transaction client through to the repository', async () => {
      const tx = { marker: 'tx' } as never;
      const periodStart = new Date('2026-02-01T00:00:00Z');
      const periodEnd = new Date('2026-03-01T00:00:00Z');
      repo.setPeriod.mockResolvedValue({ tenantId: 7 });

      await setPeriod.execute(7, periodStart, periodEnd, tx);

      expect(repo.setPeriod).toHaveBeenCalledWith(
        7,
        periodStart,
        periodEnd,
        tx,
      );
    });
  });

  describe('MovePendingPlanDateHandler', () => {
    it('moves the date of a waiting plan change to the new period end', async () => {
      repo.movePendingPlanDate.mockResolvedValue({ count: 1 });
      const end = new Date('2026-11-09T16:51:01Z');
      await movePendingPlanDate.execute(7, end);
      expect(repo.movePendingPlanDate).toHaveBeenCalledWith(7, end);
      expect(logger.info).toHaveBeenCalled();
    });

    it('does nothing (and says nothing) when no plan change is waiting', async () => {
      repo.movePendingPlanDate.mockResolvedValue({ count: 0 });
      await movePendingPlanDate.execute(7, new Date());
      expect(logger.info).not.toHaveBeenCalled();
    });
  });
});
