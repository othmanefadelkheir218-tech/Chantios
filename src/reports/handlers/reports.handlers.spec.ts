import { NotificationsService } from '../../notifications/notifications.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { MarginsService } from '../../margins/margins.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { MediaService } from '../../media/media.service';
import { ProjectsService } from '../../projects/projects.service';
import { ServicesService } from '../../services/services.service';
import { StockService } from '../../stock/stock.service';
import { ReportRepository } from '../repositories/report.repository';
import { CreateReportHandler } from './create-report.handler';
import { DeclareMaterialsHandler } from './declare-materials.handler';
import { FindReportsHandler } from './find-reports.handler';
import { LatestProgressHandler } from './latest-progress.handler';
import { PrefillMaterialsHandler } from './prefill-materials.handler';
import { ReportAlertsHandler } from './report-alerts.handler';
import { UpdateReportHandler } from './update-report.handler';

const actor = { userId: 4, tenantId: 1, roleId: 3, email: 's@test.local' };
const FIXED = new Date('2026-11-03T00:00:00Z');

const report = (over: Record<string, unknown> = {}) => ({
  id: 9,
  tenantId: 1,
  projectId: 12,
  reportDate: FIXED,
  progressPct: 40,
  weather: null,
  note: null,
  createdBy: 4,
  createdAt: FIXED,
  updatedAt: FIXED,
  ...over,
});

const movement = (materialId: number, quantity: string) => ({
  id: materialId * 100,
  materialId,
  projectId: 12,
  reportId: 9,
  type: 'consumption',
  quantity,
  unitPrice: '6',
});

const notifications = { dispatch: jest.fn() };

describe('Reports handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    findByProjectAndDate: jest.fn(),
    findLatestByProject: jest.fn(),
    findProjectsWithNoReportSince: jest.fn(),
    findProgressUnchangedSince: jest.fn(),
  };
  const tx = { marker: 'tx' };
  const tenantPrisma = {
    db: { $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) },
  };
  const projects = { findOne: jest.fn() };
  const stock = {
    declareConsumption: jest.fn(),
    walkRecipeFor: jest.fn(),
    checkMaterialCoverage: jest.fn(),
  };
  const services = { findOne: jest.fn() };
  const media = { findAll: jest.fn() };
  const margins = { checkProjectThresholds: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateReportHandler;
  let update: UpdateReportHandler;
  let find: FindReportsHandler;
  let declare: DeclareMaterialsHandler;
  let prefill: PrefillMaterialsHandler;
  let progress: LatestProgressHandler;
  let alerts: ReportAlertsHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation((fn) => fn(tx));
    const handlers = [
      CreateReportHandler,
      UpdateReportHandler,
      FindReportsHandler,
      DeclareMaterialsHandler,
      PrefillMaterialsHandler,
      LatestProgressHandler,
      ReportAlertsHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        { provide: NotificationsService, useValue: notifications },
        ...handlers,
        { provide: ReportRepository, useValue: repo },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: ProjectsService, useValue: projects },
        { provide: StockService, useValue: stock },
        { provide: ServicesService, useValue: services },
        { provide: MediaService, useValue: media },
        { provide: AuditService, useValue: audit },
        { provide: MarginsService, useValue: margins },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateReportHandler);
    update = module.get(UpdateReportHandler);
    find = module.get(FindReportsHandler);
    declare = module.get(DeclareMaterialsHandler);
    prefill = module.get(PrefillMaterialsHandler);
    progress = module.get(LatestProgressHandler);
    alerts = module.get(ReportAlertsHandler);

    projects.findOne.mockResolvedValue({ id: 12, status: 'in_progress' });
  });

  describe('CreateReportHandler', () => {
    const body = {
      project_id: 12,
      report_date: '2026-11-03',
      progress_pct: 40,
    };

    it('creates a report', async () => {
      repo.findByProjectAndDate.mockResolvedValue(null);
      repo.create.mockResolvedValue(report());
      const result = await create.execute(body, actor, 'all');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 12,
          progressPct: 40,
          createdBy: 4,
        }),
      );
      expect(result.id).toBe(9);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('a second post for the same project and day updates the SAME row', async () => {
      repo.findByProjectAndDate.mockResolvedValue(report());
      repo.update.mockResolvedValue(report({ progressPct: 55 }));
      const result = await create.execute(
        { ...body, progress_pct: 55 },
        actor,
        'all',
      );
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({ progressPct: 55 }),
      );
      expect(result.id).toBe(9);
    });

    it('defaults report_date to today', async () => {
      repo.findByProjectAndDate.mockResolvedValue(null);
      repo.create.mockResolvedValue(report());
      await create.execute({ project_id: 12, progress_pct: 10 }, actor, 'all');
      const today = new Date().toISOString().slice(0, 10);
      expect(repo.findByProjectAndDate).toHaveBeenCalledWith(
        12,
        new Date(today),
      );
    });

    it('a worker (scope own) can never post', async () => {
      await expect(create.execute(body, actor, 'own')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('only on an in_progress project', async () => {
      projects.findOne.mockResolvedValue({ id: 12, status: 'prospect' });
      await expect(create.execute(body, actor, 'all')).rejects.toThrow(
        /in_progress/,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('UpdateReportHandler', () => {
    it('corrects the report and keeps the old value in the audit', async () => {
      repo.findById.mockResolvedValue(report());
      repo.update.mockResolvedValue(report({ progressPct: 60 }));
      await update.execute(9, { progress_pct: 60 }, actor, 'all');
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', entityType: 'report' }),
      );
    });

    it('a worker cannot edit', async () => {
      await expect(
        update.execute(9, { progress_pct: 60 }, actor, 'own'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('FindReportsHandler', () => {
    it('GET one comes with its photos', async () => {
      repo.findById.mockResolvedValue(report());
      media.findAll.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
      const result = await find.findOne(9, actor, 'all');
      expect(media.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ entity_type: 'report', entity_id: 9 }),
        actor,
        'all',
      );
      expect(result.photos).toEqual([{ id: 1 }]);
    });

    it("scope own never sees someone else's report", async () => {
      repo.findById.mockResolvedValue(report({ createdBy: 99 }));
      await expect(find.findOne(9, actor, 'own')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('scope own lists only its own reports', async () => {
      repo.findMany.mockResolvedValue([[], 0]);
      await find.execute({ page: 1, limit: 20 }, actor, 'own');
      expect(repo.findMany).toHaveBeenCalledWith({ createdBy: 4 }, 0, 20);
    });
  });

  describe('PrefillMaterialsHandler — a READ', () => {
    it('returns the recipe walk and writes nothing', async () => {
      repo.findById.mockResolvedValue(report());
      stock.walkRecipeFor.mockResolvedValue([
        { materialId: 1, quantity: '3' },
        { materialId: 2, quantity: '1' },
      ]);
      const result = await prefill.execute(
        9,
        { service_id: 3, quantity: '20' },
        'all',
      );
      expect(stock.walkRecipeFor).toHaveBeenCalledWith([
        { serviceId: 3, quantity: '20' },
      ]);
      expect(result.items).toHaveLength(2);
      expect(stock.declareConsumption).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('a worker cannot pre-fill', async () => {
      await expect(
        prefill.execute(9, { service_id: 3, quantity: '20' }, 'own'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DeclareMaterialsHandler — the stock door', () => {
    const items = [
      { material_id: 1, quantity: '3.5' },
      { material_id: 2, quantity: '1' },
    ];

    it('writes every item through the stock SERVICE in ONE transaction', async () => {
      repo.findById.mockResolvedValue(report());
      stock.declareConsumption
        .mockResolvedValueOnce(movement(1, '-3.5'))
        .mockResolvedValueOnce(movement(2, '-1'));

      const result = await declare.execute(9, { items }, actor, 'all');

      expect(tenantPrisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(stock.declareConsumption).toHaveBeenCalledTimes(2);
      expect(stock.declareConsumption).toHaveBeenNthCalledWith(
        1,
        {
          materialId: 1,
          projectId: 12,
          reportId: 9,
          quantity: '3.5',
        },
        actor,
        tx,
      );
      expect(result.movements).toHaveLength(2);
      // one audit row, after the commit
      expect(audit.write).toHaveBeenCalledTimes(1);
      // stock left: low-stock / unmet-reservation is checked once per material
      expect(stock.checkMaterialCoverage).toHaveBeenCalledTimes(2);
      expect(stock.checkMaterialCoverage).toHaveBeenCalledWith(1, 1);
      expect(stock.checkMaterialCoverage).toHaveBeenCalledWith(2, 1);
      // the material cost rose: the 80 % / 95 % levels are re-checked
      expect(margins.checkProjectThresholds).toHaveBeenCalledWith(12, actor);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'declare_materials', entityId: 9 }),
      );
    });

    it('a failure on item 2 propagates out of the transaction and writes no audit', async () => {
      repo.findById.mockResolvedValue(report());
      stock.declareConsumption
        .mockResolvedValueOnce(movement(1, '-3.5'))
        .mockRejectedValueOnce(new NotFoundException('Material not found'));

      await expect(declare.execute(9, { items }, actor, 'all')).rejects.toThrow(
        NotFoundException,
      );
      expect(audit.write).not.toHaveBeenCalled();
      expect(margins.checkProjectThresholds).not.toHaveBeenCalled();
    });

    it('a worker can never declare material', async () => {
      await expect(declare.execute(9, { items }, actor, 'own')).rejects.toThrow(
        ForbiddenException,
      );
      expect(stock.declareConsumption).not.toHaveBeenCalled();
    });

    it('refuses a zero or negative quantity before anything is written', async () => {
      repo.findById.mockResolvedValue(report());
      for (const quantity of ['0', '-2']) {
        await expect(
          declare.execute(
            9,
            { items: [{ material_id: 1, quantity }] },
            actor,
            'all',
          ),
        ).rejects.toThrow(BadRequestException);
      }
      expect(tenantPrisma.db.$transaction).not.toHaveBeenCalled();
    });

    it('refuses the same material twice in one declaration', async () => {
      repo.findById.mockResolvedValue(report());
      await expect(
        declare.execute(
          9,
          {
            items: [
              { material_id: 1, quantity: '1' },
              { material_id: 1, quantity: '2' },
            ],
          },
          actor,
          'all',
        ),
      ).rejects.toThrow(/only appear once/);
    });

    it('404 on an unknown report', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(declare.execute(9, { items }, actor, 'all')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('LatestProgressHandler', () => {
    it("returns the newest report's progress", async () => {
      repo.findLatestByProject.mockResolvedValue(report({ progressPct: 70 }));
      const result = await progress.execute(12);
      expect(result.progressPct).toBe(70);
    });

    it('a project with no report yet is at 0%', async () => {
      repo.findLatestByProject.mockResolvedValue(null);
      const result = await progress.execute(12);
      expect(result).toMatchObject({ progressPct: 0, reportDate: null });
    });
  });

  describe('ReportAlertsHandler', () => {
    it('missing-report check uses 3 days, stalled check uses 7', async () => {
      repo.findProjectsWithNoReportSince.mockResolvedValue([
        { projectId: 12, tenantId: 1, projectName: 'Site A' },
      ]);
      repo.findProgressUnchangedSince.mockResolvedValue([]);
      expect(await alerts.checkMissingReports()).toEqual({ count: 1 });
      expect(await alerts.checkStalledProgress()).toEqual({ count: 0 });
      expect(repo.findProjectsWithNoReportSince).toHaveBeenCalledWith(3);
      expect(repo.findProgressUnchangedSince).toHaveBeenCalledWith(7);
    });

    it('missing report -> missing_report, repeated at most every 3 days', async () => {
      repo.findProjectsWithNoReportSince.mockResolvedValue([
        { projectId: 12, tenantId: 4, projectName: 'Site A' },
      ]);
      await alerts.checkMissingReports();
      expect(notifications.dispatch).toHaveBeenCalledWith('missing_report', {
        tenantId: 4,
        dedupeDays: 3,
        payload: {
          entity_id: 12,
          project_id: 12,
          project_name: 'Site A',
          days: 3,
        },
      });
    });

    it('progress unchanged -> progress_stalled, repeated at most every 7 days', async () => {
      repo.findProgressUnchangedSince.mockResolvedValue([
        { projectId: 13, tenantId: 4, projectName: 'Site B' },
      ]);
      await alerts.checkStalledProgress();
      expect(notifications.dispatch).toHaveBeenCalledWith('progress_stalled', {
        tenantId: 4,
        dedupeDays: 7,
        payload: {
          entity_id: 13,
          project_id: 13,
          project_name: 'Site B',
          days: 7,
        },
      });
    });
  });
});
