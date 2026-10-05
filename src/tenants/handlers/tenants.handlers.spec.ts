import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantRepository } from '../repositories/tenant.repository';
import { CreateTenantHandler } from './create-tenant.handler';
import { SetTenantStatusHandler } from './set-tenant-status.handler';

/** Arguments of every call to a mock, typed. */
const callsOf = (fn: jest.Mock) => fn.mock.calls as unknown[][];

const actor = { adminUserId: null, ip: '127.0.0.1' };
const tenant = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  name: 'Dupont',
  email: 'contact@dupont.test',
  status: 'active',
  endOfDayReminderTime: new Date('1970-01-01T18:00:00.000Z'),
  ...over,
});

describe('Tenants handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    setStatus: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateTenantHandler;
  let setStatus: SetTenantStatusHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [CreateTenantHandler, SetTenantStatusHandler];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: TenantRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateTenantHandler);
    setStatus = module.get(SetTenantStatusHandler);
  });

  describe('CreateTenantHandler', () => {
    it('creates the tenant and writes one audit entry', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(tenant());

      const result = await create.execute(
        { name: 'Dupont', email: 'Contact@Dupont.test' },
        actor,
      );

      expect(repo.findByEmail).toHaveBeenCalledWith('contact@dupont.test');
      expect(result.endOfDayReminderTime).toBe('18:00');
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'create',
        entityType: 'tenant',
        entityId: 't1',
      });
    });

    it('rejects a second tenant with the same email', async () => {
      repo.findByEmail.mockResolvedValue(tenant());
      await expect(
        create.execute({ name: 'Other', email: 'contact@dupont.test' }, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });
  });

  describe('SetTenantStatusHandler', () => {
    it('records the old and the new status', async () => {
      repo.findById.mockResolvedValue(tenant());
      repo.setStatus.mockResolvedValue(tenant({ status: 'suspended' }));

      await setStatus.execute(
        't1',
        { status: 'suspended', reason: 'unpaid' },
        actor,
      );

      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'set_status',
        oldValue: { status: 'active' },
        newValue: { status: 'suspended', reason: 'unpaid' },
      });
    });

    it('refuses an unchanged status', async () => {
      repo.findById.mockResolvedValue(tenant());
      await expect(
        setStatus.execute('t1', { status: 'active' }, actor),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('404 when the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        setStatus.execute('x', { status: 'banned' }, actor),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
