import { containing } from '../../common/testing/spec-helpers';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import {
  costRatioPct,
  levelsReached,
} from '../helpers/margin-threshold.helper';
import { ClosureSnapshotRepository } from '../repositories/closure-snapshot.repository';
import { MarginAlertRepository } from '../repositories/margin-alert.repository';
import { MarginRepository } from '../repositories/margin.repository';
import { CheckThresholdsHandler } from './check-thresholds.handler';
import { FindMarginsHandler } from './find-margins.handler';
import { FindProjectMarginHandler } from './find-project-margin.handler';
import { FindSnapshotHandler } from './find-snapshot.handler';
import { MarginBreakdownHandler } from './margin-breakdown.handler';
import { VoidSnapshotHandler } from './void-snapshot.handler';
import { WriteSnapshotHandler } from './write-snapshot.handler';

const d = (n: string | number) => new Prisma.Decimal(n);
const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const tx = { marker: 'tx' } as never;
const FIXED = new Date('2026-10-06T00:00:00Z');

const margin = (over: Record<string, unknown> = {}) => ({
  projectId: 10,
  name: 'Bathroom',
  status: 'in_progress',
  budgetExclVat: d(10000),
  materialCost: d(0),
  laborCost: d(0),
  billCost: d(0),
  totalCost: d(0),
  marginExclVat: d(10000),
  marginPct: d(100),
  ...over,
});

const snapshot = (over: Record<string, unknown> = {}) => ({
  id: 77,
  tenantId: 1,
  projectId: 10,
  budgetExclVat: d(10000),
  totalCost: d(3000),
  marginExclVat: d(7000),
  marginPct: d(70),
  closedBy: 1,
  closedAt: FIXED,
  voidedAt: null,
  voidedBy: null,
  costs: [
    { costTypeId: 1, amount: d(1000), costType: { name: 'material' } },
    { costTypeId: 3, amount: d(2000), costType: { name: 'labor' } },
  ],
  ...over,
});

const notifications = { dispatch: jest.fn() };

describe('margin-threshold.helper — the 80 / 95 logic', () => {
  it('no accepted quote -> a ratio of null, never a divide-by-zero', () => {
    expect(costRatioPct(500, 0)).toBeNull();
    expect(levelsReached(500, 0)).toEqual([]);
  });

  it('under 80 %: nothing', () => {
    expect(levelsReached(7999, 10000)).toEqual([]);
  });

  it('exactly 80 %: warning', () => {
    expect(levelsReached(8000, 10000)).toEqual(['warning']);
  });

  it('83 %: still only the warning', () => {
    expect(levelsReached(8300, 10000)).toEqual(['warning']);
  });

  it('exactly 95 %: warning and critical (critical implies warning)', () => {
    expect(levelsReached(9500, 10000)).toEqual(['warning', 'critical']);
  });

  it('over 100 % (a loss) is still critical', () => {
    expect(levelsReached(12000, 10000)).toEqual(['warning', 'critical']);
  });
});

describe('Margins handlers', () => {
  const margins = {
    findAll: jest.fn(),
    findByProject: jest.fn(),
    findBreakdownByProject: jest.fn(),
  };
  const snapshots = {
    create: jest.fn(),
    findLiveByProject: jest.fn(),
    void: jest.fn(),
  };
  const alerts = {
    createIfAbsent: jest.fn(),
    deleteLevelsNotIn: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let findMargins: FindMarginsHandler;
  let findProjectMargin: FindProjectMarginHandler;
  let breakdown: MarginBreakdownHandler;
  let findSnapshot: FindSnapshotHandler;
  let writeSnapshot: WriteSnapshotHandler;
  let voidSnapshot: VoidSnapshotHandler;
  let check: CheckThresholdsHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      FindMarginsHandler,
      FindProjectMarginHandler,
      MarginBreakdownHandler,
      FindSnapshotHandler,
      WriteSnapshotHandler,
      VoidSnapshotHandler,
      CheckThresholdsHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        { provide: NotificationsService, useValue: notifications },
        ...handlers,
        { provide: MarginRepository, useValue: margins },
        { provide: ClosureSnapshotRepository, useValue: snapshots },
        { provide: MarginAlertRepository, useValue: alerts },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    findMargins = module.get(FindMarginsHandler);
    findProjectMargin = module.get(FindProjectMarginHandler);
    breakdown = module.get(MarginBreakdownHandler);
    findSnapshot = module.get(FindSnapshotHandler);
    writeSnapshot = module.get(WriteSnapshotHandler);
    voidSnapshot = module.get(VoidSnapshotHandler);
    check = module.get(CheckThresholdsHandler);
  });

  describe('reads', () => {
    it('lists margins, paginated, with a null margin_pct passed through', async () => {
      margins.findAll.mockResolvedValue([
        [margin({ budgetExclVat: d(0), marginPct: null })],
        1,
      ]);
      const result = await findMargins.execute({ page: 1, limit: 20 });
      expect(margins.findAll).toHaveBeenCalledWith(undefined, 0, 20);
      expect(result.total).toBe(1);
      expect(result.data[0].marginPct).toBeNull();
    });

    it('one margin; a project of another tenant is a 404', async () => {
      margins.findByProject.mockResolvedValue(margin());
      expect((await findProjectMargin.execute(10)).projectId).toBe(10);
      margins.findByProject.mockResolvedValue(null);
      await expect(findProjectMargin.execute(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('the breakdown has one line per cost type and adds up', async () => {
      margins.findByProject.mockResolvedValue(margin());
      margins.findBreakdownByProject.mockResolvedValue([
        { costTypeId: 1, name: 'material', amount: d(400) },
        { costTypeId: 2, name: 'subcontractor', amount: d(2500) },
        { costTypeId: 9, name: 'insurance', amount: d(150) },
      ]);
      const result = await breakdown.execute(10);
      expect(result.items.map((i) => i.name)).toEqual([
        'material',
        'subcontractor',
        'insurance',
      ]);
      expect(result.totalCost.toString()).toBe('3050');
    });

    it('the snapshot read: 404 for a project with none', async () => {
      margins.findByProject.mockResolvedValue(margin());
      snapshots.findLiveByProject.mockResolvedValue(null);
      await expect(findSnapshot.execute(10)).rejects.toThrow(
        /no closure snapshot/,
      );
      snapshots.findLiveByProject.mockResolvedValue(snapshot());
      const result = await findSnapshot.execute(10);
      expect(result.costs).toEqual([
        { costTypeId: 1, name: 'material', amount: d(1000) },
        { costTypeId: 3, name: 'labor', amount: d(2000) },
      ]);
    });
  });

  describe('WriteSnapshotHandler', () => {
    it('writes the snapshot and one cost row per cost type, inside the given tx', async () => {
      snapshots.findLiveByProject.mockResolvedValue(null);
      margins.findByProject.mockResolvedValue(
        margin({
          totalCost: d(3000),
          marginExclVat: d(7000),
          marginPct: d(70),
        }),
      );
      margins.findBreakdownByProject.mockResolvedValue([
        { costTypeId: 1, name: 'material', amount: d(1000) },
        { costTypeId: 3, name: 'labor', amount: d(2000) },
      ]);
      snapshots.create.mockResolvedValue(snapshot());

      const result = await writeSnapshot.execute(10, actor, tx);

      expect(snapshots.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 10,
          budgetExclVat: d(10000),
          totalCost: d(3000),
          marginExclVat: d(7000),
          closedBy: 1,
        }),
        [
          { costTypeId: 1, amount: d(1000) },
          { costTypeId: 3, amount: d(2000) },
        ],
        tx,
      );
      expect(result.id).toBe(77);
    });

    it('is idempotent: a project that already has a live snapshot gets no second one', async () => {
      snapshots.findLiveByProject.mockResolvedValue(snapshot());
      const result = await writeSnapshot.execute(10, actor, tx);
      expect(snapshots.create).not.toHaveBeenCalled();
      expect(result.id).toBe(77);
    });

    it('a project with no accepted quote still closes: margin_pct stays null', async () => {
      snapshots.findLiveByProject.mockResolvedValue(null);
      margins.findByProject.mockResolvedValue(
        margin({
          budgetExclVat: d(0),
          totalCost: d(250),
          marginExclVat: d(-250),
          marginPct: null,
        }),
      );
      margins.findBreakdownByProject.mockResolvedValue([]);
      snapshots.create.mockResolvedValue(snapshot({ marginPct: null }));
      await writeSnapshot.execute(10, actor, tx);
      expect(snapshots.create).toHaveBeenCalledWith(
        expect.objectContaining({ marginPct: null }),
        [],
        tx,
      );
    });

    it("a project that is not this tenant's is a 404", async () => {
      snapshots.findLiveByProject.mockResolvedValue(null);
      margins.findByProject.mockResolvedValue(null);
      await expect(writeSnapshot.execute(99, actor, tx)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('VoidSnapshotHandler', () => {
    it('voids the live snapshot, never deletes it', async () => {
      snapshots.findLiveByProject.mockResolvedValue(snapshot());
      const id = await voidSnapshot.execute(10, actor, tx);
      expect(snapshots.void).toHaveBeenCalledWith(77, 1, tx);
      expect(id).toBe(77);
    });

    it('nothing to void is not an error', async () => {
      snapshots.findLiveByProject.mockResolvedValue(null);
      expect(await voidSnapshot.execute(10, actor, tx)).toBeNull();
      expect(snapshots.void).not.toHaveBeenCalled();
    });
  });

  describe('CheckThresholdsHandler — each level fires ONCE', () => {
    it('crosses 80 % the first time -> one warning, row written', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ totalCost: d(8100), budgetExclVat: d(10000) }),
      );
      alerts.createIfAbsent.mockResolvedValue(true);

      const result = await check.execute(10, 1);

      expect(alerts.createIfAbsent).toHaveBeenCalledWith(10, 'warning', 1);
      expect(result.fired).toEqual(['warning']);
      // ...and the warning really goes out, to admin + manager (the margins module)
      expect(notifications.dispatch).toHaveBeenCalledTimes(1);
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'margin_warning',
        expect.objectContaining({
          tenantId: 1,
          payload: containing({ entity_id: 10, cost_pct: '81' }),
        }),
      );
    });

    it('saves again at 83 % -> the row exists, NOTHING is sent', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ totalCost: d(8300), budgetExclVat: d(10000) }),
      );
      alerts.createIfAbsent.mockResolvedValue(false); // the PK says: already there

      const result = await check.execute(10, 1);

      expect(result.reached).toEqual(['warning']);
      expect(result.fired).toEqual([]);
      // the row already existed: NOT ONE alert is sent (no mail on every save)
      expect(notifications.dispatch).not.toHaveBeenCalled();
    });

    it('later crosses 95 % -> only the critical is new', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ totalCost: d(9600), budgetExclVat: d(10000) }),
      );
      alerts.createIfAbsent
        .mockResolvedValueOnce(false) // warning already fired
        .mockResolvedValueOnce(true); // critical is new

      const result = await check.execute(10, 1);

      expect(result.fired).toEqual(['critical']);
      expect(notifications.dispatch).toHaveBeenCalledTimes(1);
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'margin_critical',
        expect.objectContaining({
          payload: containing({ cost_pct: '96' }),
        }),
      );
    });

    it('both levels new in one save (jump to 96 %) -> one warning and one critical', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ totalCost: d(9600), budgetExclVat: d(10000) }),
      );
      alerts.createIfAbsent.mockResolvedValue(true);
      await check.execute(10, 1);
      expect(
        notifications.dispatch.mock.calls.map((call: unknown[]) => call[0]),
      ).toEqual(['margin_warning', 'margin_critical']);
    });

    it('an extra accepted quote drops the cost under 80 % -> both rows deleted, levels can fire again', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ totalCost: d(9600), budgetExclVat: d(12000) }), // 80 % of 12000 = 9600 -> still warning
      );
      alerts.createIfAbsent.mockResolvedValue(false);
      let result = await check.execute(10, 1);
      expect(result.reached).toEqual(['warning']);
      expect(alerts.deleteLevelsNotIn).toHaveBeenLastCalledWith(10, [
        'warning',
      ]); // critical's row is gone

      margins.findByProject.mockResolvedValue(
        margin({ totalCost: d(9600), budgetExclVat: d(13000) }), // 73.8 %
      );
      result = await check.execute(10, 1);
      expect(result.reached).toEqual([]);
      expect(alerts.deleteLevelsNotIn).toHaveBeenLastCalledWith(10, []); // both gone
      expect(alerts.createIfAbsent).toHaveBeenCalledTimes(1); // only the first call created rows
    });

    it('a project that is not in_progress sends nothing', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ status: 'completed', totalCost: d(9900) }),
      );
      const result = await check.execute(10, 1);
      expect(result).toEqual({ reached: [], fired: [] });
      expect(alerts.createIfAbsent).not.toHaveBeenCalled();
      expect(alerts.deleteLevelsNotIn).not.toHaveBeenCalled();
    });

    it('no budget -> no alert, no error', async () => {
      margins.findByProject.mockResolvedValue(
        margin({ budgetExclVat: d(0), totalCost: d(500), marginPct: null }),
      );
      const result = await check.execute(10, 1);
      expect(result.reached).toEqual([]);
      expect(alerts.createIfAbsent).not.toHaveBeenCalled();
    });

    it('never throws: a failure is logged and swallowed (the save already happened)', async () => {
      margins.findByProject.mockRejectedValue(new Error('db down'));
      await expect(check.execute(10, 1)).resolves.toEqual({
        reached: [],
        fired: [],
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
