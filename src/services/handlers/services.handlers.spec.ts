import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { CategoriesService } from '../../categories/categories.service';
import { MaterialsService } from '../../materials/materials.service';
import { ServiceRepository } from '../repositories/service.repository';
import { ArchiveServiceHandler } from './archive-service.handler';
import { CreateServiceHandler } from './create-service.handler';
import { FindServiceHandler } from './find-service.handler';
import { FindServicesHandler } from './find-services.handler';
import { GetRecipeHandler } from './get-recipe.handler';
import { SetRecipeHandler } from './set-recipe.handler';
import { UpdateServiceHandler } from './update-service.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const service = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  categoryId: 1,
  description: 'Painting (per m2)',
  unit: 'm2',
  priceExclVat: new Prisma.Decimal('12.00'),
  defaultVatRate: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const category = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: null,
  name: 'Painting',
  isActive: true,
  createdAt: new Date(),
  ...over,
});

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

describe('Services handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    findRecipe: jest.fn(),
    replaceRecipe: jest.fn(),
  };
  const categories = { findVisibleById: jest.fn() };
  const materials = { findByIdRaw: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let createService: CreateServiceHandler;
  let findServices: FindServicesHandler;
  let findService: FindServiceHandler;
  let updateService: UpdateServiceHandler;
  let archiveService: ArchiveServiceHandler;
  let setRecipe: SetRecipeHandler;
  let getRecipe: GetRecipeHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateServiceHandler,
      FindServicesHandler,
      FindServiceHandler,
      UpdateServiceHandler,
      ArchiveServiceHandler,
      SetRecipeHandler,
      GetRecipeHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: ServiceRepository, useValue: repo },
        { provide: CategoriesService, useValue: categories },
        { provide: MaterialsService, useValue: materials },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createService = module.get(CreateServiceHandler);
    findServices = module.get(FindServicesHandler);
    findService = module.get(FindServiceHandler);
    updateService = module.get(UpdateServiceHandler);
    archiveService = module.get(ArchiveServiceHandler);
    setRecipe = module.get(SetRecipeHandler);
    getRecipe = module.get(GetRecipeHandler);
  });

  describe('CreateServiceHandler', () => {
    it('rejects an unknown/invisible category', async () => {
      categories.findVisibleById.mockResolvedValue(null);
      await expect(
        createService.execute(
          {
            category_id: 99,
            description: 'X',
            unit: 'm2',
            price_excl_vat: '10',
          },
          actor,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a service', async () => {
      categories.findVisibleById.mockResolvedValue(category());
      repo.create.mockResolvedValue(service());
      const result = await createService.execute(
        {
          category_id: 1,
          description: 'Painting (per m2)',
          unit: 'm2',
          price_excl_vat: '12.00',
        },
        actor,
      );
      expect(result.description).toBe('Painting (per m2)');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('FindServicesHandler', () => {
    it('returns a paginated list', async () => {
      repo.findMany.mockResolvedValue([[service()], 1]);
      const result = await findServices.execute({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
    });
  });

  describe('FindServiceHandler', () => {
    it('rejects an unknown service', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findService.execute(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('UpdateServiceHandler', () => {
    it('rejects an unknown service', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        updateService.execute(99, { description: 'X' }, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates a service', async () => {
      repo.findById.mockResolvedValue(service());
      repo.update.mockResolvedValue(service({ description: 'New name' }));
      const result = await updateService.execute(
        10,
        { description: 'New name' },
        actor,
      );
      expect(result.description).toBe('New name');
    });
  });

  describe('ArchiveServiceHandler', () => {
    it('archives a service', async () => {
      repo.findById.mockResolvedValue(service());
      repo.setActive.mockResolvedValue(service({ isActive: false }));
      const result = await archiveService.execute(10, actor);
      expect(result.isActive).toBe(false);
    });
  });

  describe('GetRecipeHandler', () => {
    it('rejects an unknown service', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(getRecipe.execute(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the recipe rows', async () => {
      repo.findById.mockResolvedValue(service());
      repo.findRecipe.mockResolvedValue([
        {
          id: 1,
          tenantId: 1,
          serviceId: 10,
          materialId: 5,
          quantityPerUnit: new Prisma.Decimal('0.15'),
        },
      ]);
      const result = await getRecipe.execute(10);
      expect(result).toHaveLength(1);
    });
  });

  describe('SetRecipeHandler', () => {
    it('rejects an unknown service', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(setRecipe.execute(99, { items: [] }, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects a non-positive quantity_per_unit', async () => {
      repo.findById.mockResolvedValue(service());
      await expect(
        setRecipe.execute(
          10,
          { items: [{ material_id: 5, quantity_per_unit: '0' }] },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.replaceRecipe).not.toHaveBeenCalled();
    });

    it('rejects an unknown material_id', async () => {
      repo.findById.mockResolvedValue(service());
      materials.findByIdRaw.mockResolvedValue(null);
      await expect(
        setRecipe.execute(
          10,
          { items: [{ material_id: 99, quantity_per_unit: '0.15' }] },
          actor,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repo.replaceRecipe).not.toHaveBeenCalled();
    });

    it('replaces the recipe in one transaction', async () => {
      repo.findById.mockResolvedValue(service());
      materials.findByIdRaw.mockResolvedValue(material());
      repo.findRecipe.mockResolvedValue([
        {
          id: 1,
          tenantId: 1,
          serviceId: 10,
          materialId: 5,
          quantityPerUnit: new Prisma.Decimal('0.15'),
        },
      ]);
      const result = await setRecipe.execute(
        10,
        { items: [{ material_id: 5, quantity_per_unit: '0.15' }] },
        actor,
      );
      expect(repo.replaceRecipe).toHaveBeenCalledWith(10, actor.tenantId, [
        { materialId: 5, quantityPerUnit: '0.15' },
      ]);
      expect(result).toHaveLength(1);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });
});
