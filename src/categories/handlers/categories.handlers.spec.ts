import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { CategoryRepository } from '../repositories/category.repository';
import { ArchiveCategoryHandler } from './archive-category.handler';
import { CreateCategoryHandler } from './create-category.handler';
import { FindCategoriesHandler } from './find-categories.handler';
import { UpdateCategoryHandler } from './update-category.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const category = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  name: 'Painting',
  isActive: true,
  createdAt: new Date(),
  ...over,
});

describe('Categories handlers', () => {
  const repo = {
    findVisible: jest.fn(),
    findVisibleById: jest.fn(),
    create: jest.fn(),
    findOwnById: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let createCategory: CreateCategoryHandler;
  let findCategories: FindCategoriesHandler;
  let updateCategory: UpdateCategoryHandler;
  let archiveCategory: ArchiveCategoryHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateCategoryHandler,
      FindCategoriesHandler,
      UpdateCategoryHandler,
      ArchiveCategoryHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: CategoryRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createCategory = module.get(CreateCategoryHandler);
    findCategories = module.get(FindCategoriesHandler);
    updateCategory = module.get(UpdateCategoryHandler);
    archiveCategory = module.get(ArchiveCategoryHandler);
  });

  describe('FindCategoriesHandler', () => {
    it('returns shared defaults plus the tenant own rows', async () => {
      repo.findVisible.mockResolvedValue([
        category({ id: 1, tenantId: null }),
        category({ id: 2, tenantId: 1 }),
      ]);
      const result = await findCategories.execute(1);
      expect(repo.findVisible).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  describe('CreateCategoryHandler', () => {
    it('creates a category carrying the actor tenant_id', async () => {
      repo.create.mockResolvedValue(category());
      const result = await createCategory.execute({ name: 'Painting' }, actor);
      expect(repo.create).toHaveBeenCalledWith({
        name: 'Painting',
        tenantId: actor.tenantId,
      });
      expect(result.name).toBe('Painting');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('UpdateCategoryHandler', () => {
    it('refuses a NULL-tenant default (findOwnById returns null)', async () => {
      repo.findOwnById.mockResolvedValue(null);
      await expect(
        updateCategory.execute(1, { name: 'X' }, actor),
      ).rejects.toThrow(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates an own row', async () => {
      repo.findOwnById.mockResolvedValue(category());
      repo.update.mockResolvedValue(category({ name: 'New name' }));
      const result = await updateCategory.execute(
        10,
        { name: 'New name' },
        actor,
      );
      expect(result.name).toBe('New name');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('ArchiveCategoryHandler', () => {
    it('refuses a NULL-tenant default', async () => {
      repo.findOwnById.mockResolvedValue(null);
      await expect(archiveCategory.execute(1, actor)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.setActive).not.toHaveBeenCalled();
    });

    it('archives an own row', async () => {
      repo.findOwnById.mockResolvedValue(category());
      repo.setActive.mockResolvedValue(category({ isActive: false }));
      const result = await archiveCategory.execute(10, actor);
      expect(result.isActive).toBe(false);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });
});
