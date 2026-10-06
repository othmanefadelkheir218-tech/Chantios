import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { MaterialRepository } from '../repositories/material.repository';
import { ArchiveMaterialHandler } from './archive-material.handler';
import { CreateMaterialHandler } from './create-material.handler';
import { FindLowStockHandler } from './find-low-stock.handler';
import { FindMaterialHandler } from './find-material.handler';
import { FindMaterialsHandler } from './find-materials.handler';
import { StockLevelHandler } from './stock-level.handler';
import { UpdateMaterialHandler } from './update-material.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z');

const material = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  description: 'Paint',
  unit: 'L',
  purchasePrice: new Prisma.Decimal('6.00'),
  minimumStock: new Prisma.Decimal('10'),
  isActive: true,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  ...over,
});

const stockLevel = (over: Record<string, unknown> = {}) => ({
  materialId: 10,
  onHand: new Prisma.Decimal(100),
  reserved: new Prisma.Decimal(30),
  available: new Prisma.Decimal(70),
  ...over,
});

describe('Materials handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    findWithStockLevels: jest.fn(),
    findStockLevel: jest.fn(),
    findLowStock: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let createMaterial: CreateMaterialHandler;
  let findMaterials: FindMaterialsHandler;
  let findMaterial: FindMaterialHandler;
  let updateMaterial: UpdateMaterialHandler;
  let archiveMaterial: ArchiveMaterialHandler;
  let stockLevelHandler: StockLevelHandler;
  let findLowStock: FindLowStockHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateMaterialHandler,
      FindMaterialsHandler,
      FindMaterialHandler,
      UpdateMaterialHandler,
      ArchiveMaterialHandler,
      StockLevelHandler,
      FindLowStockHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: MaterialRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createMaterial = module.get(CreateMaterialHandler);
    findMaterials = module.get(FindMaterialsHandler);
    findMaterial = module.get(FindMaterialHandler);
    updateMaterial = module.get(UpdateMaterialHandler);
    archiveMaterial = module.get(ArchiveMaterialHandler);
    stockLevelHandler = module.get(StockLevelHandler);
    findLowStock = module.get(FindLowStockHandler);
  });

  describe('CreateMaterialHandler', () => {
    it('rejects a negative purchase_price', async () => {
      await expect(
        createMaterial.execute(
          {
            description: 'Paint',
            unit: 'L',
            purchase_price: '-1',
            minimum_stock: '0',
          },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a material with no quantity field', async () => {
      repo.create.mockResolvedValue(material());
      const result = await createMaterial.execute(
        {
          description: 'Paint',
          unit: 'L',
          purchase_price: '6.00',
          minimum_stock: '10',
        },
        actor,
      );
      expect(result).not.toHaveProperty('quantity');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('FindMaterialsHandler', () => {
    it('returns a paginated list joined with stock levels', async () => {
      repo.findWithStockLevels.mockResolvedValue([
        [{ ...material(), stock: stockLevel() }],
        1,
      ]);
      const result = await findMaterials.execute({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
      expect(result.data[0].available.toString()).toBe('70');
    });
  });

  describe('FindMaterialHandler / StockLevelHandler', () => {
    it('rejects an unknown material', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(stockLevelHandler.execute(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns a material with on_hand/reserved/available', async () => {
      repo.findById.mockResolvedValue(material());
      repo.findStockLevel.mockResolvedValue(stockLevel());
      const result = await stockLevelHandler.execute(10);
      expect(result.onHand.toString()).toBe('100');
      expect(result.available.toString()).toBe('70');
    });

    it('findByIdRaw passes through to the repository', async () => {
      repo.findById.mockResolvedValue(material());
      const result = await findMaterial.findByIdRaw(10);
      expect(result).toEqual(material());
    });
  });

  describe('UpdateMaterialHandler', () => {
    it('rejects an unknown material', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        updateMaterial.execute(99, { purchase_price: '5' }, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a negative minimum_stock', async () => {
      repo.findById.mockResolvedValue(material());
      await expect(
        updateMaterial.execute(10, { minimum_stock: '-5' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates purchase_price (future movements only, no history rewrite)', async () => {
      repo.findById.mockResolvedValue(material());
      repo.update.mockResolvedValue(
        material({ purchasePrice: new Prisma.Decimal('7.00') }),
      );
      const result = await updateMaterial.execute(
        10,
        { purchase_price: '7.00' },
        actor,
      );
      expect(result.purchasePrice.toString()).toBe('7');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('ArchiveMaterialHandler', () => {
    it('archives a material (is_active = false)', async () => {
      repo.findById.mockResolvedValue(material());
      repo.setActive.mockResolvedValue(material({ isActive: false }));
      const result = await archiveMaterial.execute(10, actor);
      expect(result.isActive).toBe(false);
    });
  });

  describe('FindLowStockHandler', () => {
    it('returns materials at or below minimum_stock', async () => {
      repo.findLowStock.mockResolvedValue([
        { ...material(), stock: stockLevel({ onHand: new Prisma.Decimal(5) }) },
      ]);
      const result = await findLowStock.execute();
      expect(result).toHaveLength(1);
    });
  });
});
