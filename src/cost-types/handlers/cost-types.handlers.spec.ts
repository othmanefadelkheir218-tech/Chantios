import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { CostTypeRepository } from '../repositories/cost-type.repository';
import { CreateCostTypeHandler } from './create-cost-type.handler';
import { FindCostTypesHandler } from './find-cost-types.handler';
import { UpdateCostTypeHandler } from './update-cost-type.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const FIXED = new Date('2026-10-06T00:00:00Z');

const costType = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  name: 'insurance',
  isActive: true,
  createdAt: FIXED,
  ...over,
});

describe('Cost types handlers', () => {
  const repo = {
    findAllForTenant: jest.fn(),
    findVisibleById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    findOwnById: jest.fn(),
    update: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let findCostTypes: FindCostTypesHandler;
  let createCostType: CreateCostTypeHandler;
  let updateCostType: UpdateCostTypeHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      FindCostTypesHandler,
      CreateCostTypeHandler,
      UpdateCostTypeHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: CostTypeRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    findCostTypes = module.get(FindCostTypesHandler);
    createCostType = module.get(CreateCostTypeHandler);
    updateCostType = module.get(UpdateCostTypeHandler);
  });

  it('lists shared defaults plus the tenant own rows', async () => {
    repo.findAllForTenant.mockResolvedValue([
      costType({ id: 1, tenantId: null, name: 'material' }),
      costType(),
    ]);
    const result = await findCostTypes.execute(1);
    expect(repo.findAllForTenant).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
  });

  it('creates an own row carrying the actor tenant_id', async () => {
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue(costType());
    const result = await createCostType.execute({ name: ' insurance ' }, actor);
    expect(repo.create).toHaveBeenCalledWith({
      name: 'insurance',
      tenantId: 1,
    });
    expect(result.name).toBe('insurance');
  });

  it('refuses a name that repeats a default or an own row', async () => {
    repo.findByName.mockResolvedValue(
      costType({ tenantId: null, name: 'material' }),
    );
    await expect(
      createCostType.execute({ name: 'Material' }, actor),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('a NULL-tenant default is never editable (own-row lookup finds nothing)', async () => {
    repo.findOwnById.mockResolvedValue(null);
    await expect(
      updateCostType.execute(1, { name: 'hacked' }, actor),
    ).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('renames an own row', async () => {
    repo.findOwnById.mockResolvedValue(costType());
    repo.findByName.mockResolvedValue(null);
    repo.update.mockResolvedValue(costType({ name: 'machine rental' }));
    const result = await updateCostType.execute(
      10,
      { name: 'machine rental' },
      actor,
    );
    expect(repo.update).toHaveBeenCalledWith(10, { name: 'machine rental' });
    expect(result.name).toBe('machine rental');
  });
});
