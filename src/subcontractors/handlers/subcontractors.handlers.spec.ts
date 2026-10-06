import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ProjectsService } from '../../projects/projects.service';
import { ContractRepository } from '../repositories/contract.repository';
import { SubcontractorRepository } from '../repositories/subcontractor.repository';
import { CreateContractHandler } from './create-contract.handler';
import { SetContractStatusHandler } from './set-contract-status.handler';
import { UpdateContractHandler } from './update-contract.handler';
import { UpdateSubcontractorHandler } from './update-subcontractor.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const FIXED = new Date('2026-10-06T00:00:00Z');

const contract = (over: Record<string, unknown> = {}) => ({
  id: 4,
  tenantId: 1,
  subcontractorId: 3,
  projectId: 12,
  description: null,
  amountExclVat: '4500.00',
  status: 'in_progress',
  startDate: null,
  endDate: null,
  createdBy: 1,
  createdAt: FIXED,
  updatedAt: FIXED,
  ...over,
});

const subcontractor = (over: Record<string, unknown> = {}) => ({
  id: 3,
  tenantId: 1,
  companyName: 'Janssens',
  trade: 'plumbing',
  email: null,
  phone: null,
  vatNumber: null,
  hourlyRate: null,
  isActive: true,
  createdAt: FIXED,
  updatedAt: FIXED,
  ...over,
});

describe('Subcontractors handlers', () => {
  const contracts = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
  };
  const subs = { findById: jest.fn(), update: jest.fn() };
  const projects = { findOne: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let createContract: CreateContractHandler;
  let updateContract: UpdateContractHandler;
  let setStatus: SetContractStatusHandler;
  let updateSub: UpdateSubcontractorHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateContractHandler,
      UpdateContractHandler,
      SetContractStatusHandler,
      UpdateSubcontractorHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: ContractRepository, useValue: contracts },
        { provide: SubcontractorRepository, useValue: subs },
        { provide: ProjectsService, useValue: projects },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createContract = module.get(CreateContractHandler);
    updateContract = module.get(UpdateContractHandler);
    setStatus = module.get(SetContractStatusHandler);
    updateSub = module.get(UpdateSubcontractorHandler);
  });

  describe('UpdateSubcontractorHandler', () => {
    it('saves the edit', async () => {
      subs.findById.mockResolvedValue(subcontractor());
      subs.update.mockResolvedValue(subcontractor({ trade: 'electricity' }));
      const result = await updateSub.execute(
        3,
        { trade: 'electricity' },
        actor,
      );
      expect(subs.update).toHaveBeenCalledWith(3, { trade: 'electricity' });
      expect(result.trade).toBe('electricity');
    });

    it('404s on an unknown subcontractor', async () => {
      subs.findById.mockResolvedValue(null);
      await expect(updateSub.execute(9, {}, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('CreateContractHandler', () => {
    const body = {
      subcontractor_id: 3,
      project_id: 12,
      amount_excl_vat: '4500.00',
    };

    it('creates an in_progress contract', async () => {
      subs.findById.mockResolvedValue(subcontractor());
      projects.findOne.mockResolvedValue({ id: 12, status: 'in_progress' });
      contracts.create.mockResolvedValue(contract());

      const result = await createContract.execute(body, actor);
      expect(contracts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 12,
          subcontractorId: 3,
          status: 'in_progress',
          createdBy: 1,
        }),
      );
      expect(result.status).toBe('in_progress');
    });

    it('refuses a cancelled project', async () => {
      subs.findById.mockResolvedValue(subcontractor());
      projects.findOne.mockResolvedValue({ id: 12, status: 'cancelled' });
      await expect(createContract.execute(body, actor)).rejects.toThrow(
        /cancelled project/,
      );
      expect(contracts.create).not.toHaveBeenCalled();
    });

    it('refuses an archived subcontractor', async () => {
      subs.findById.mockResolvedValue(subcontractor({ isActive: false }));
      await expect(createContract.execute(body, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses end_date before start_date', async () => {
      await expect(
        createContract.execute(
          { ...body, start_date: '2026-11-10', end_date: '2026-11-01' },
          actor,
        ),
      ).rejects.toThrow(/end_date must not be before start_date/);
    });

    it('refuses a negative amount', async () => {
      await expect(
        createContract.execute({ ...body, amount_excl_vat: '-1' }, actor),
      ).rejects.toThrow(/must not be negative/);
    });
  });

  describe('UpdateContractHandler', () => {
    it('checks the end date against the stored start date', async () => {
      contracts.findById.mockResolvedValue(
        contract({ startDate: new Date('2026-11-10') }),
      );
      await expect(
        updateContract.execute(4, { end_date: '2026-11-01' }, actor),
      ).rejects.toThrow(/end_date must not be before start_date/);
      expect(contracts.update).not.toHaveBeenCalled();
    });
  });

  describe('SetContractStatusHandler', () => {
    it('in_progress -> completed is allowed', async () => {
      contracts.findById.mockResolvedValue(contract());
      contracts.setStatus.mockResolvedValue(contract({ status: 'completed' }));
      const result = await setStatus.execute(4, { status: 'completed' }, actor);
      expect(result.status).toBe('completed');
    });

    it('a completed contract cannot move again', async () => {
      contracts.findById.mockResolvedValue(contract({ status: 'completed' }));
      await expect(
        setStatus.execute(4, { status: 'cancelled' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(contracts.setStatus).not.toHaveBeenCalled();
    });

    it('in_progress -> in_progress is refused', async () => {
      contracts.findById.mockResolvedValue(contract());
      await expect(
        setStatus.execute(4, { status: 'in_progress' }, actor),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
