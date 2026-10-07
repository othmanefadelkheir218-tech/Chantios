import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { ApplyPendingPlanHandler } from './apply-pending-plan.handler';
import { SetPeriodHandler } from './set-period.handler';
import { SetStatusHandler } from './set-status.handler';

describe('Subscriptions handlers (step 14 additions)', () => {
  const repo = {
    applyPendingPlan: jest.fn(),
    setStatus: jest.fn(),
    setPeriod: jest.fn(),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let applyPendingPlan: ApplyPendingPlanHandler;
  let setStatus: SetStatusHandler;
  let setPeriod: SetPeriodHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      ApplyPendingPlanHandler,
      SetStatusHandler,
      SetPeriodHandler,
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
    it('writes the given status for the tenant', async () => {
      repo.setStatus.mockResolvedValue({ tenantId: 7, status: 'past_due' });

      await setStatus.execute(7, 'past_due');

      expect(repo.setStatus).toHaveBeenCalledWith(7, 'past_due', undefined);
    });

    it('forwards an open transaction client through to the repository', async () => {
      const tx = { marker: 'tx' } as never;
      repo.setStatus.mockResolvedValue({ tenantId: 7 });

      await setStatus.execute(7, 'cancelled', tx);

      expect(repo.setStatus).toHaveBeenCalledWith(7, 'cancelled', tx);
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
});
