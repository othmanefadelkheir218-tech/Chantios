import { ConflictException, ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { callArg } from '../../common/testing/spec-helpers';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { MaterialsService } from '../../materials/materials.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RolesService } from '../../roles/roles.service';
import { StockService } from '../../stock/stock.service';
import { IMPORTS_QUEUE } from '../dto/import-job.dto';
import { hashImportRows } from '../helpers/import-hash.helper';
import { ImportBatchRepository } from '../repositories/import-batch.repository';
import { CreateImportHandler } from './create-import.handler';
import { RunImportHandler } from './run-import.handler';
import { RunMaterialsImportHandler } from './run-materials-import.handler';
import { RunStockImportHandler } from './run-stock-import.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const party = { userId: 1, tenantId: 1 };

const material = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  description: 'Peinture',
  unit: 'L',
  purchasePrice: new Prisma.Decimal('6.00'),
  minimumStock: new Prisma.Decimal('10'),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const batch = (over: Record<string, unknown> = {}) => ({
  id: 7,
  tenantId: 1,
  type: 'materials',
  status: 'pending',
  fileName: 'materiaux.xlsx',
  rowsHash: 'h',
  rowCount: 1,
  rows: [],
  errors: null,
  createdCount: 0,
  updatedCount: 0,
  createdBy: 1,
  createdAt: new Date(),
  startedAt: null,
  finishedAt: null,
  ...over,
});

const uniqueError = () =>
  new Prisma.PrismaClientKnownRequestError('unique', {
    code: 'P2002',
    clientVersion: 'test',
  });

describe('Imports handlers', () => {
  const batches = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findActiveByHash: jest.fn(),
    update: jest.fn(),
  };
  const queue = { add: jest.fn() };
  const roles = { findRoleById: jest.fn(), findOverridesForRole: jest.fn() };
  const materials = { loadForImport: jest.fn(), writeImport: jest.fn() };
  const stock = {
    recordImportedMovements: jest.fn(),
    checkMaterialCoverage: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const tx = { tx: true };
  const tenantPrisma = {
    db: {
      $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)),
    },
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let createImport: CreateImportHandler;
  let runMaterials: RunMaterialsImportHandler;
  let runStock: RunStockImportHandler;
  let runImport: RunImportHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const handlers = [
      CreateImportHandler,
      RunMaterialsImportHandler,
      RunStockImportHandler,
      RunImportHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: ImportBatchRepository, useValue: batches },
        { provide: getQueueToken(IMPORTS_QUEUE), useValue: queue },
        { provide: RolesService, useValue: roles },
        { provide: MaterialsService, useValue: materials },
        { provide: StockService, useValue: stock },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createImport = module.get(CreateImportHandler);
    runMaterials = module.get(RunMaterialsImportHandler);
    runStock = module.get(RunStockImportHandler);
    runImport = module.get(RunImportHandler);

    roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
    roles.findOverridesForRole.mockResolvedValue([]);
    batches.findActiveByHash.mockResolvedValue(null);
    batches.create.mockImplementation((data: Record<string, unknown>) =>
      Promise.resolve(batch(data)),
    );
    batches.update.mockImplementation((id: number, data: object) =>
      Promise.resolve(batch({ id, ...data })),
    );
    materials.loadForImport.mockResolvedValue({ byId: [], taken: [] });
  });

  const newRow = (over: Record<string, unknown> = {}) => ({
    row: 2,
    description: 'Ruban',
    unit: 'rouleau',
    purchase_price: '3.00',
    minimum_stock: '5',
    ...over,
  });

  describe('CreateImportHandler', () => {
    it('saves a pending batch with the rows hash and queues the job', async () => {
      const rows = [newRow()];
      const result = await createImport.materials(
        { file_name: 'materiaux.xlsx', rows },
        actor,
      );
      expect(result.status).toBe('pending');
      expect(batches.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'materials',
          rowCount: 1,
          rowsHash: hashImportRows(rows),
          createdBy: 1,
        }),
      );
      expect(queue.add).toHaveBeenCalledWith(
        'run',
        { batchId: 7, tenantId: 1, userId: 1 },
        expect.any(Object),
      );
      expect(result).not.toHaveProperty('rows');
    });

    it('refuses the same rows again -> 409, nothing saved', async () => {
      batches.findActiveByHash.mockResolvedValue(batch({ status: 'done' }));
      await expect(
        createImport.materials(
          { file_name: 'x.xlsx', rows: [newRow()] },
          actor,
        ),
      ).rejects.toThrow(ConflictException);
      expect(batches.create).not.toHaveBeenCalled();
    });

    it('turns a same-moment double upload into 409', async () => {
      batches.findActiveByHash
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(batch());
      batches.create.mockRejectedValue(uniqueError());
      await expect(
        createImport.materials(
          { file_name: 'x.xlsx', rows: [newRow()] },
          actor,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses stock_depart for a role that may not adjust stock -> 403', async () => {
      roles.findRoleById.mockResolvedValue({ id: 3, name: 'sales' });
      await expect(
        createImport.materials(
          { file_name: 'x.xlsx', rows: [newRow({ stock_depart: '4' })] },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(batches.create).not.toHaveBeenCalled();
    });

    it('refuses adjustment rows in a stock file for a non-manager -> 403', async () => {
      roles.findRoleById.mockResolvedValue({ id: 4, name: 'site_supervisor' });
      await expect(
        createImport.stock(
          {
            file_name: 's.xlsx',
            rows: [
              {
                row: 2,
                id: 10,
                description: 'Peinture',
                type: 'adjustment',
                quantity: '-1',
                note: 'casse',
              },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses update rows when the role has no stock edit right -> 403', async () => {
      roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
      roles.findOverridesForRole.mockResolvedValue([
        {
          module: 'stock',
          canView: true,
          canCreate: true,
          canEdit: false,
          canDelete: false,
          scope: 'all',
        },
      ]);
      await expect(
        createImport.materials(
          { file_name: 'x.xlsx', rows: [newRow({ id: 10 })] },
          actor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('marks the batch failed when the job cannot be queued', async () => {
      queue.add.mockRejectedValue(new Error('redis down'));
      const result = await createImport.materials(
        { file_name: 'x.xlsx', rows: [newRow()] },
        actor,
      );
      expect(result.status).toBe('failed');
    });
  });

  describe('RunMaterialsImportHandler', () => {
    it('collects every error and writes nothing', async () => {
      materials.loadForImport.mockResolvedValue({
        byId: [
          material(),
          material({ id: 11, description: 'Vieux', isActive: false }),
        ],
        taken: [{ id: 12, description: 'Plâtre', isActive: true }],
      });
      const rows = [
        newRow({ row: 2, description: 'plâtre ' }),
        newRow({ row: 3, description: 'Colle' }),
        newRow({ row: 4, description: 'colle' }),
        newRow({ row: 5, id: 10, description: 'Autre nom', unit: 'L' }),
        newRow({ row: 6, id: 10, description: 'Peinture', unit: 'kg' }),
        newRow({ row: 7, id: 11, description: 'Vieux' }),
        newRow({ row: 8, id: 99, description: 'Inconnu' }),
        newRow({ row: 9, purchase_price: '-1', description: 'Neg' }),
        newRow({ row: 10, description: 'Sd', stock_depart: '0' }),
      ];
      const result = await runMaterials.execute(
        batch({ rows }) as never,
        party,
      );
      expect(result.status).toBe('failed');
      const messages =
        result.status === 'failed' ? result.errors.map((e) => e.message) : [];
      expect(messages).toEqual([
        'Ligne 2 : le matériau « Plâtre » existe déjà.',
        'Ligne 4 : le matériau « colle » apparaît deux fois dans le fichier (lignes 3 et 4).',
        "Ligne 5 : l'id 10 ne correspond pas à ce nom. Le nom attendu est « Peinture ».",
        "Ligne 6 : l'id 10 apparaît deux fois dans le fichier (lignes 5 et 6).",
        "Ligne 6 : l'unité ne peut pas être changée par import (L → kg).",
        'Ligne 7 : le matériau « Vieux » (id 11) est archivé.',
        "Ligne 8 : aucun matériau avec l'id 99.",
        "Ligne 9 : le prix d'achat ne peut pas être négatif.",
        'Ligne 10 : le stock de départ doit être plus grand que 0.',
      ]);
      expect(tenantPrisma.db.$transaction).not.toHaveBeenCalled();
    });

    it('creates, updates changed rows only, and writes Stock initial in one transaction', async () => {
      materials.loadForImport.mockResolvedValue({
        byId: [material(), material({ id: 11, description: 'Ruban adhésif' })],
        taken: [],
      });
      materials.writeImport.mockResolvedValue([
        material({ id: 20, description: 'Colle' }),
        material({ id: 21, description: 'Vis' }),
      ]);
      const rows = [
        newRow({ row: 2, description: 'Colle', stock_depart: '40' }),
        newRow({ row: 3, description: 'Vis' }),
        // unchanged -> skipped
        newRow({
          row: 4,
          id: 10,
          description: 'peinture',
          unit: 'L',
          purchase_price: '6',
          minimum_stock: '10.000',
        }),
        // price changed -> updated
        newRow({
          row: 5,
          id: 11,
          description: 'Ruban adhésif',
          unit: 'L',
          purchase_price: '7.50',
          minimum_stock: '10',
        }),
      ];
      const result = await runMaterials.execute(
        batch({ rows }) as never,
        party,
      );

      expect(result).toEqual({
        status: 'done',
        createdCount: 2,
        updatedCount: 1,
        touchedMaterialIds: [20],
      });
      expect(tenantPrisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(callArg(materials.writeImport, 0, 1)).toEqual([
        { id: 11, purchasePrice: '7.50', minimumStock: '10' },
      ]);
      expect(stock.recordImportedMovements).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            type: 'adjustment',
            quantity: '40',
            note: 'Stock initial',
          }),
        ],
        7,
        party,
        tx,
      );
      expect(batches.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ status: 'done', createdCount: 2 }),
        tx,
      );
    });

    it('fails cleanly when the unique index refuses a name created meanwhile', async () => {
      materials.writeImport.mockRejectedValue(uniqueError());
      const result = await runMaterials.execute(
        batch({ rows: [newRow()] }) as never,
        party,
      );
      expect(result.status).toBe('failed');
    });
  });

  describe('RunStockImportHandler', () => {
    const stockRow = (over: Record<string, unknown> = {}) => ({
      row: 2,
      id: 10,
      description: 'Peinture',
      type: 'purchase',
      quantity: '25',
      ...over,
    });

    it('collects every error and writes nothing', async () => {
      materials.loadForImport.mockResolvedValue({
        byId: [material()],
        taken: [],
      });
      const rows = [
        stockRow({ row: 2, quantity: '-3' }),
        stockRow({ row: 3, type: 'adjustment', quantity: '0' }),
        stockRow({ row: 4, description: 'Autre' }),
        stockRow({ row: 5, id: 99 }),
      ];
      const result = await runStock.execute(
        batch({ type: 'stock', rows }) as never,
        party,
      );
      const messages =
        result.status === 'failed' ? result.errors.map((e) => e.message) : [];
      expect(messages).toEqual([
        "Ligne 2 : la quantité d'un achat doit être plus grande que 0.",
        "Ligne 3 : la quantité d'un ajustement ne peut pas être 0.",
        'Ligne 3 : une note est obligatoire pour un ajustement.',
        "Ligne 4 : l'id 10 ne correspond pas à ce nom. Le nom attendu est « Peinture ».",
        "Ligne 5 : aucun matériau avec l'id 99.",
      ]);
      expect(tenantPrisma.db.$transaction).not.toHaveBeenCalled();
    });

    it('writes every movement at the material price in one transaction', async () => {
      materials.loadForImport.mockResolvedValue({
        byId: [material()],
        taken: [],
      });
      const rows = [
        stockRow({ row: 2 }),
        stockRow({
          row: 3,
          type: 'adjustment',
          quantity: '-2',
          note: 'Inventaire',
        }),
      ];
      const result = await runStock.execute(
        batch({ type: 'stock', rows }) as never,
        party,
      );
      expect(result).toEqual({
        status: 'done',
        createdCount: 2,
        updatedCount: 0,
        touchedMaterialIds: [10],
      });
      const written = callArg<Array<{ material: { purchasePrice: unknown } }>>(
        stock.recordImportedMovements,
        0,
        0,
      );
      expect(written).toHaveLength(2);
      expect(String(written[0].material.purchasePrice)).toBe('6');
    });
  });

  describe('RunImportHandler', () => {
    it('pending -> processing -> done, then coverage, audit and import_done', async () => {
      batches.findById.mockResolvedValue(batch());
      jest.spyOn(runMaterials, 'execute').mockResolvedValue({
        status: 'done',
        createdCount: 3,
        updatedCount: 1,
        touchedMaterialIds: [20],
      });
      await runImport.execute(7, party);
      expect(batches.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ status: 'processing' }),
      );
      expect(stock.checkMaterialCoverage).toHaveBeenCalledWith(20, 1);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'import', entityId: 7 }),
      );
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'import_done',
        expect.objectContaining({
          userIds: [1],
          payload: expect.objectContaining({
            import_batch_id: 7,
            created_count: 3,
            updated_count: 1,
          }) as unknown,
        }),
      );
    });

    it('saves the errors as failed and sends import_failed', async () => {
      batches.findById.mockResolvedValue(batch());
      const errors = [{ row: 2, field: 'id', message: 'Ligne 2 : x' }];
      jest
        .spyOn(runMaterials, 'execute')
        .mockResolvedValue({ status: 'failed', errors });
      await runImport.execute(7, party);
      expect(batches.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ status: 'failed', errors }),
      );
      expect(stock.checkMaterialCoverage).not.toHaveBeenCalled();
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'import_failed',
        expect.objectContaining({
          payload: expect.objectContaining({ error_count: 1 }) as unknown,
        }),
      );
    });

    it('a crash is a failed batch with one general error, and the user is told', async () => {
      batches.findById.mockResolvedValue(batch({ type: 'stock' }));
      jest.spyOn(runStock, 'execute').mockRejectedValue(new Error('boom'));
      await runImport.execute(7, party);
      expect(batches.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ status: 'failed' }),
      );
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'import_failed',
        expect.any(Object),
      );
    });

    it('skips a batch that is not pending (a job run twice)', async () => {
      batches.findById.mockResolvedValue(batch({ status: 'done' }));
      await runImport.execute(7, party);
      expect(batches.update).not.toHaveBeenCalled();
      expect(notifications.dispatch).not.toHaveBeenCalled();
    });
  });
});
