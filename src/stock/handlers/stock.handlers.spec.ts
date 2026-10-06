import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { MaterialsService } from '../../materials/materials.service';
import { ServicesService } from '../../services/services.service';
import { StockMovementRepository } from '../repositories/stock-movement.repository';
import { StockReservationRepository } from '../repositories/stock-reservation.repository';
import { CheckCoverageHandler } from './check-coverage.handler';
import { ConsumeReservationHandler } from './consume-reservation.handler';
import { CreateReservationsHandler } from './create-reservations.handler';
import { FindMovementsHandler } from './find-movements.handler';
import { FindReservationsHandler } from './find-reservations.handler';
import { RecordAdjustmentHandler } from './record-adjustment.handler';
import { RecordConsumptionHandler } from './record-consumption.handler';
import { RecordPurchaseHandler } from './record-purchase.handler';
import { ReleaseReservationsHandler } from './release-reservations.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const material = (over: Record<string, unknown> = {}) => ({
  id: 5,
  tenantId: 1,
  description: 'Paint',
  unit: 'L',
  purchasePrice: new Prisma.Decimal('6.00'),
  minimumStock: new Prisma.Decimal('10'),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const movement = (over: Record<string, unknown> = {}) => ({
  id: 100,
  tenantId: 1,
  materialId: 5,
  projectId: null,
  reportId: null,
  purchaseInvoiceId: null,
  type: 'purchase',
  quantity: new Prisma.Decimal('100'),
  unitPrice: new Prisma.Decimal('6.00'),
  movementDate: new Date(),
  note: null,
  createdBy: 1,
  createdAt: new Date(),
  ...over,
});

const reservation = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: 1,
  projectId: 20,
  materialId: 5,
  reservedQuantity: new Prisma.Decimal('30'),
  remainingQuantity: new Prisma.Decimal('30'),
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('Stock handlers', () => {
  const movementsRepo = {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    sumByProject: jest.fn(),
  };
  const reservationsRepo = {
    upsertAdd: jest.fn(),
    findByProject: jest.fn(),
    findByMaterial: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    decrementRemaining: jest.fn(),
    releaseByProject: jest.fn(),
  };
  const materials = { findByIdRaw: jest.fn(), getStockLevel: jest.fn() };
  const services = { getRecipeRaw: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let recordPurchase: RecordPurchaseHandler;
  let recordAdjustment: RecordAdjustmentHandler;
  let recordConsumption: RecordConsumptionHandler;
  let findMovements: FindMovementsHandler;
  let findReservations: FindReservationsHandler;
  let createReservations: CreateReservationsHandler;
  let consumeReservation: ConsumeReservationHandler;
  let releaseReservations: ReleaseReservationsHandler;
  let checkCoverage: CheckCoverageHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      RecordPurchaseHandler,
      RecordAdjustmentHandler,
      RecordConsumptionHandler,
      FindMovementsHandler,
      FindReservationsHandler,
      CreateReservationsHandler,
      ConsumeReservationHandler,
      ReleaseReservationsHandler,
      CheckCoverageHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: StockMovementRepository, useValue: movementsRepo },
        { provide: StockReservationRepository, useValue: reservationsRepo },
        { provide: MaterialsService, useValue: materials },
        { provide: ServicesService, useValue: services },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    recordPurchase = module.get(RecordPurchaseHandler);
    recordAdjustment = module.get(RecordAdjustmentHandler);
    recordConsumption = module.get(RecordConsumptionHandler);
    findMovements = module.get(FindMovementsHandler);
    findReservations = module.get(FindReservationsHandler);
    createReservations = module.get(CreateReservationsHandler);
    consumeReservation = module.get(ConsumeReservationHandler);
    releaseReservations = module.get(ReleaseReservationsHandler);
    checkCoverage = module.get(CheckCoverageHandler);

    materials.getStockLevel.mockResolvedValue({
      materialId: 5,
      onHand: new Prisma.Decimal(100),
      reserved: new Prisma.Decimal(30),
      available: new Prisma.Decimal(70),
    });
  });

  describe('RecordPurchaseHandler', () => {
    it('rejects a negative quantity', async () => {
      await expect(
        recordPurchase.execute({ material_id: 5, quantity: '-10' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(movementsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown material', async () => {
      materials.findByIdRaw.mockResolvedValue(null);
      await expect(
        recordPurchase.execute({ material_id: 99, quantity: '10' }, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('freezes unit_price from materials.purchase_price, forces project_id null, runs coverage', async () => {
      materials.findByIdRaw.mockResolvedValue(material());
      movementsRepo.create.mockResolvedValue(movement());

      const result = await recordPurchase.execute(
        { material_id: 5, quantity: '100' },
        actor,
      );

      expect(movementsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          materialId: 5,
          projectId: null,
          type: 'purchase',
          quantity: '100',
          unitPrice: '6',
        }),
      );
      expect(result.type).toBe('purchase');
      expect(materials.getStockLevel).toHaveBeenCalledWith(5);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('uses a caller-supplied unit_price instead of the material default', async () => {
      materials.findByIdRaw.mockResolvedValue(material());
      movementsRepo.create.mockResolvedValue(movement());

      await recordPurchase.execute(
        { material_id: 5, quantity: '100', unit_price: '7.50' },
        actor,
      );

      expect(movementsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ unitPrice: '7.50' }),
      );
    });
  });

  describe('RecordAdjustmentHandler', () => {
    it('rejects a 0 quantity', async () => {
      await expect(
        recordAdjustment.execute(
          { material_id: 5, quantity: '0', note: 'count' },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(movementsRepo.create).not.toHaveBeenCalled();
    });

    it('always freezes unit_price from materials.purchase_price (no override field)', async () => {
      materials.findByIdRaw.mockResolvedValue(material());
      movementsRepo.create.mockResolvedValue(
        movement({ type: 'adjustment', quantity: new Prisma.Decimal('-2') }),
      );

      await recordAdjustment.execute(
        { material_id: 5, quantity: '-2', note: 'breakage' },
        actor,
      );

      expect(movementsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          unitPrice: material().purchasePrice,
          type: 'adjustment',
        }),
      );
      expect(materials.getStockLevel).not.toHaveBeenCalled();
    });

    it('runs the coverage check for a positive adjustment', async () => {
      materials.findByIdRaw.mockResolvedValue(material());
      movementsRepo.create.mockResolvedValue(
        movement({ type: 'adjustment', quantity: new Prisma.Decimal('5') }),
      );

      await recordAdjustment.execute(
        { material_id: 5, quantity: '5', note: 'found extra' },
        actor,
      );
      expect(materials.getStockLevel).toHaveBeenCalledWith(5);
    });
  });

  describe('RecordConsumptionHandler', () => {
    it('writes a negative quantity movement and calls consumeReservation', async () => {
      materials.findByIdRaw.mockResolvedValue(material());
      movementsRepo.create.mockResolvedValue(
        movement({
          type: 'consumption',
          projectId: 20,
          reportId: 7,
          quantity: new Prisma.Decimal('-3'),
        }),
      );
      reservationsRepo.decrementRemaining.mockResolvedValue(
        reservation({ remainingQuantity: new Prisma.Decimal('27') }),
      );

      const result = await recordConsumption.execute(
        { materialId: 5, projectId: 20, reportId: 7, quantity: '3' },
        actor,
      );

      expect(movementsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: '-3',
          projectId: 20,
          reportId: 7,
          type: 'consumption',
        }),
      );
      expect(reservationsRepo.decrementRemaining).toHaveBeenCalledWith(
        20,
        5,
        '3',
      );
      expect(result.type).toBe('consumption');
    });
  });

  describe('FindMovementsHandler / FindReservationsHandler', () => {
    it('returns a paginated movements list', async () => {
      movementsRepo.findMany.mockResolvedValue([[movement()], 1]);
      const result = await findMovements.execute({
        page: 1,
        limit: 20,
      });
      expect(result.total).toBe(1);
    });

    it('returns a paginated reservations list', async () => {
      reservationsRepo.findMany.mockResolvedValue([[reservation()], 1]);
      const result = await findReservations.execute({
        page: 1,
        limit: 20,
      });
      expect(result.total).toBe(1);
    });
  });

  describe('CreateReservationsHandler', () => {
    it('walks the recipe and upserts a reservation per material', async () => {
      services.getRecipeRaw.mockResolvedValue([
        { materialId: 5, quantityPerUnit: new Prisma.Decimal('0.15') },
      ]);
      reservationsRepo.upsertAdd.mockResolvedValue(reservation());

      const result = await createReservations.execute(
        20,
        [{ serviceId: 1, quantity: 20 }],
        actor,
      );

      expect(reservationsRepo.upsertAdd).toHaveBeenCalledWith(
        20,
        5,
        '3',
        actor.tenantId,
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('skips a line with no service_id (free-text line reserves nothing)', async () => {
      const result = await createReservations.execute(
        20,
        [{ serviceId: null, quantity: 5 }],
        actor,
      );
      expect(services.getRecipeRaw).not.toHaveBeenCalled();
      expect(reservationsRepo.upsertAdd).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  describe('ConsumeReservationHandler', () => {
    it('no-ops when there is no active reservation', async () => {
      reservationsRepo.decrementRemaining.mockResolvedValue(null);
      const result = await consumeReservation.execute(20, 5, '3', actor);
      expect(result).toBeNull();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('lowers remaining_quantity and writes audit', async () => {
      reservationsRepo.decrementRemaining.mockResolvedValue(
        reservation({ remainingQuantity: new Prisma.Decimal('27') }),
      );
      const result = await consumeReservation.execute(20, 5, '3', actor);
      expect(result?.remainingQuantity.toString()).toBe('27');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('ReleaseReservationsHandler', () => {
    it('releases every active reservation of a project', async () => {
      reservationsRepo.releaseByProject.mockResolvedValue(2);
      const result = await releaseReservations.execute(20, actor);
      expect(result).toEqual({ projectId: 20, released: 2 });
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('CheckCoverageHandler', () => {
    it('reports covered when available >= 0', async () => {
      const result = await checkCoverage.execute(5);
      expect(result.covered).toBe(true);
      expect(result.available.toString()).toBe('70');
    });

    it('reports not covered when available < 0', async () => {
      materials.getStockLevel.mockResolvedValue({
        materialId: 5,
        onHand: new Prisma.Decimal(10),
        reserved: new Prisma.Decimal(40),
        available: new Prisma.Decimal(-30),
      });
      const result = await checkCoverage.execute(5);
      expect(result.covered).toBe(false);
    });
  });
});
