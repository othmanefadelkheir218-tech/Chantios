import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { TenantRepository } from '../repositories/tenant.repository';
import { CreateTenantHandler } from './create-tenant.handler';
import { RestoreTenantHandler } from './restore-tenant.handler';
import { RestoreTenantsHandler } from './restore-tenants.handler';
import { SendTenantVerificationEmailHandler } from './send-tenant-verification-email.handler';
import { SessionsService } from '../../sessions/sessions.service';
import { SetTenantStatusHandler } from './set-tenant-status.handler';
import { SoftDeleteTenantHandler } from './soft-delete-tenant.handler';
import { SoftDeleteTenantsHandler } from './soft-delete-tenants.handler';
import { VerifyTenantEmailHandler } from './verify-tenant-email.handler';

/** Arguments of every call to a mock, typed. */
const callsOf = (fn: jest.Mock) => fn.mock.calls as unknown[][];

const actor = { adminUserId: null, ip: '127.0.0.1' };
const tenant = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Dupont',
  email: 'contact@dupont.test',
  status: 'active',
  endOfDayReminderTime: new Date('1970-01-01T18:00:00.000Z'),
  ...over,
});

const revokeAllForTenant = jest.fn();

describe('Tenants handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdIncludingDeleted: jest.fn(),
    findByEmail: jest.fn(),
    setStatus: jest.fn(),
    softDelete: jest.fn(),
    softDeleteMany: jest.fn(),
    restore: jest.fn(),
    restoreMany: jest.fn(),
    setEmailVerified: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const codes = { generate: jest.fn(), verify: jest.fn() };
  const email = { send: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateTenantHandler;
  let setStatus: SetTenantStatusHandler;
  let softDelete: SoftDeleteTenantHandler;
  let softDeleteMany: SoftDeleteTenantsHandler;
  let restore: RestoreTenantHandler;
  let restoreMany: RestoreTenantsHandler;
  let sendVerificationEmail: SendTenantVerificationEmailHandler;
  let verifyEmail: VerifyTenantEmailHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateTenantHandler,
      SetTenantStatusHandler,
      SoftDeleteTenantHandler,
      SoftDeleteTenantsHandler,
      RestoreTenantHandler,
      RestoreTenantsHandler,
      SendTenantVerificationEmailHandler,
      VerifyTenantEmailHandler,
    ];
    revokeAllForTenant.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: TenantRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        { provide: OneTimeCodesService, useValue: codes },
        { provide: EmailService, useValue: email },
        {
          provide: SessionsService,
          useValue: { revokeAllForTenant: revokeAllForTenant },
        },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateTenantHandler);
    setStatus = module.get(SetTenantStatusHandler);
    softDelete = module.get(SoftDeleteTenantHandler);
    softDeleteMany = module.get(SoftDeleteTenantsHandler);
    restore = module.get(RestoreTenantHandler);
    restoreMany = module.get(RestoreTenantsHandler);
    sendVerificationEmail = module.get(SendTenantVerificationEmailHandler);
    verifyEmail = module.get(VerifyTenantEmailHandler);
  });

  describe('CreateTenantHandler', () => {
    it('creates the tenant and writes one audit entry', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(tenant());

      const result = await create.execute(
        { name: 'Dupont', email: 'Contact@Dupont.test' },
        actor,
      );

      expect(repo.findByEmail).toHaveBeenCalledWith(
        'contact@dupont.test',
        undefined,
      );
      expect(result.endOfDayReminderTime).toBe('18:00');
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'create',
        entityType: 'tenant',
        entityId: 1,
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
    it('revokes every session of the tenant on suspend and on ban', async () => {
      repo.findById.mockResolvedValue(tenant());
      repo.setStatus.mockResolvedValue(tenant({ status: 'suspended' }));
      await setStatus.execute(1, { status: 'suspended' }, actor);
      expect(revokeAllForTenant).toHaveBeenCalledWith(1);

      revokeAllForTenant.mockClear();
      repo.setStatus.mockResolvedValue(tenant({ status: 'banned' }));
      await setStatus.execute(1, { status: 'banned' }, actor);
      expect(revokeAllForTenant).toHaveBeenCalledWith(1);
    });

    it('does not revoke sessions when the tenant becomes active again', async () => {
      repo.findById.mockResolvedValue(tenant({ status: 'suspended' }));
      repo.setStatus.mockResolvedValue(tenant({ status: 'active' }));
      await setStatus.execute(1, { status: 'active' }, actor);
      expect(revokeAllForTenant).not.toHaveBeenCalled();
    });

    it('records the old and the new status', async () => {
      repo.findById.mockResolvedValue(tenant());
      repo.setStatus.mockResolvedValue(tenant({ status: 'suspended' }));

      await setStatus.execute(
        1,
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
        setStatus.execute(1, { status: 'active' }, actor),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('404 when the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        setStatus.execute(999, { status: 'banned' }, actor),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('SoftDeleteTenantHandler', () => {
    it('sets deleted_at and records the old and new value', async () => {
      repo.findByIdIncludingDeleted.mockResolvedValue(
        tenant({ deletedAt: null }),
      );
      repo.softDelete.mockResolvedValue(
        tenant({ deletedAt: new Date('2026-01-01T00:00:00.000Z') }),
      );

      await softDelete.execute(1, actor);

      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'soft_delete',
        entityType: 'tenant',
        oldValue: { deleted_at: null },
      });
    });

    it('refuses a tenant already deleted', async () => {
      repo.findByIdIncludingDeleted.mockResolvedValue(
        tenant({ deletedAt: new Date('2026-01-01T00:00:00.000Z') }),
      );
      await expect(softDelete.execute(1, actor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('404 when the tenant does not exist', async () => {
      repo.findByIdIncludingDeleted.mockResolvedValue(null);
      await expect(softDelete.execute(999, actor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('RestoreTenantHandler', () => {
    it('clears deleted_at and records the old and new value', async () => {
      const deletedAt = new Date('2026-01-01T00:00:00.000Z');
      repo.findByIdIncludingDeleted.mockResolvedValue(tenant({ deletedAt }));
      repo.restore.mockResolvedValue(tenant({ deletedAt: null }));

      await restore.execute(1, actor);

      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'restore',
        entityType: 'tenant',
        oldValue: { deleted_at: deletedAt },
        newValue: { deleted_at: null },
      });
    });

    it('refuses a tenant that is not deleted', async () => {
      repo.findByIdIncludingDeleted.mockResolvedValue(
        tenant({ deletedAt: null }),
      );
      await expect(restore.execute(1, actor)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.restore).not.toHaveBeenCalled();
    });

    it('404 when the tenant does not exist', async () => {
      repo.findByIdIncludingDeleted.mockResolvedValue(null);
      await expect(restore.execute(999, actor)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('SoftDeleteTenantsHandler', () => {
    it('returns the count actually changed, not ids.length', async () => {
      repo.softDeleteMany.mockResolvedValue(1);
      const result = await softDeleteMany.execute([1, 2]);
      expect(repo.softDeleteMany).toHaveBeenCalledWith([1, 2]);
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('RestoreTenantsHandler', () => {
    it('returns the count actually changed, not ids.length', async () => {
      repo.restoreMany.mockResolvedValue(1);
      const result = await restoreMany.execute([1, 2]);
      expect(repo.restoreMany).toHaveBeenCalledWith([1, 2]);
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('SendTenantVerificationEmailHandler', () => {
    it('generates a code and emails the tenant', async () => {
      repo.findById.mockResolvedValue(tenant({ emailVerifiedAt: null }));
      codes.generate.mockResolvedValue('482917');

      const result = await sendVerificationEmail.execute(1);

      expect(codes.generate).toHaveBeenCalledWith('email_verification', {
        tenantId: 1,
      });
      expect(email.send).toHaveBeenCalledWith(
        'contact@dupont.test',
        expect.any(String),
        expect.stringContaining('482917'),
      );
      expect(result).toEqual({ sent: true });
    });

    it('refuses an already-verified tenant', async () => {
      repo.findById.mockResolvedValue(
        tenant({ emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z') }),
      );
      await expect(sendVerificationEmail.execute(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(codes.generate).not.toHaveBeenCalled();
      expect(email.send).not.toHaveBeenCalled();
    });

    it('404 when the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(sendVerificationEmail.execute(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('VerifyTenantEmailHandler', () => {
    it('sets email_verified_at on a matching code', async () => {
      repo.findById.mockResolvedValue(tenant({ emailVerifiedAt: null }));
      codes.verify.mockResolvedValue(true);
      repo.setEmailVerified.mockResolvedValue(
        tenant({ emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z') }),
      );

      await verifyEmail.execute(1, { code: '482917' }, actor);

      expect(codes.verify).toHaveBeenCalledWith(
        'email_verification',
        { tenantId: 1 },
        '482917',
      );
      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'verify_email',
        oldValue: { email_verified_at: null },
      });
    });

    it('refuses a wrong or expired code', async () => {
      repo.findById.mockResolvedValue(tenant({ emailVerifiedAt: null }));
      codes.verify.mockResolvedValue(false);

      await expect(
        verifyEmail.execute(1, { code: '000000' }, actor),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.setEmailVerified).not.toHaveBeenCalled();
    });

    it('refuses an already-verified tenant', async () => {
      repo.findById.mockResolvedValue(
        tenant({ emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z') }),
      );
      await expect(
        verifyEmail.execute(1, { code: '482917' }, actor),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(codes.verify).not.toHaveBeenCalled();
    });

    it('404 when the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        verifyEmail.execute(999, { code: '482917' }, actor),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
