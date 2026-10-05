import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RoleRepository } from '../repositories/role.repository';
import { FindPermissionsHandler } from './find-permissions.handler';
import { RemovePermissionHandler } from './remove-permission.handler';
import { UpsertPermissionHandler } from './upsert-permission.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const roles = [
  { id: 1, name: 'admin', label: 'Main Manager', isActive: true },
  { id: 2, name: 'manager', label: 'Sub Manager', isActive: true },
];

describe('Roles handlers', () => {
  const repo = {
    findRoleById: jest.fn(),
    findAllRoles: jest.fn(),
    findAllOverrides: jest.fn(),
    findOverride: jest.fn(),
    upsertOverride: jest.fn(),
    removeOverride: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let findPermissions: FindPermissionsHandler;
  let upsertPermission: UpsertPermissionHandler;
  let removePermission: RemovePermissionHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      FindPermissionsHandler,
      UpsertPermissionHandler,
      RemovePermissionHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: RoleRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    findPermissions = module.get(FindPermissionsHandler);
    upsertPermission = module.get(UpsertPermissionHandler);
    removePermission = module.get(RemovePermissionHandler);
  });

  describe('FindPermissionsHandler', () => {
    it('merges the code default with a tenant override', async () => {
      repo.findAllRoles.mockResolvedValue(roles);
      repo.findAllOverrides.mockResolvedValue([
        {
          id: 1,
          tenantId: 1,
          roleId: 2,
          module: 'invoices',
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          scope: 'all',
        },
      ]);

      const matrix = await findPermissions.execute();

      // Default: manager has NO access to invoices — the override grants view.
      const managerInvoices = matrix.find(
        (r) => r.roleId === 2 && r.module === 'invoices',
      );
      expect(managerInvoices).toMatchObject({
        canView: true,
        canCreate: false,
      });

      // Untouched default still applies elsewhere — admin keeps full access.
      const adminInvoices = matrix.find(
        (r) => r.roleId === 1 && r.module === 'invoices',
      );
      expect(adminInvoices).toMatchObject({
        canView: true,
        canCreate: true,
        canDelete: true,
      });

      // 2 roles x 16 modules
      expect(matrix.length).toBe(32);
    });
  });

  describe('UpsertPermissionHandler', () => {
    it('rejects an unknown role', async () => {
      repo.findRoleById.mockResolvedValue(null);
      await expect(
        upsertPermission.execute(
          99,
          'invoices',
          {
            can_view: true,
            can_create: false,
            can_edit: false,
            can_delete: false,
            scope: 'all',
          },
          actor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a new override and writes one audit entry', async () => {
      repo.findRoleById.mockResolvedValue(roles[1]);
      repo.findOverride.mockResolvedValue(null);
      repo.upsertOverride.mockResolvedValue({
        id: 5,
        roleId: 2,
        module: 'invoices',
        canView: true,
      });

      const result = await upsertPermission.execute(
        2,
        'invoices',
        {
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
          scope: 'all',
        },
        actor,
      );

      expect(repo.upsertOverride).toHaveBeenCalledWith(2, 'invoices', {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        scope: 'all',
      });
      expect(result.id).toBe(5);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('RemovePermissionHandler', () => {
    it('rejects an unknown role', async () => {
      repo.findRoleById.mockResolvedValue(null);
      await expect(
        removePermission.execute(99, 'invoices', actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('removes an existing override and writes one audit entry', async () => {
      repo.findRoleById.mockResolvedValue(roles[1]);
      repo.findOverride.mockResolvedValue({
        id: 5,
        roleId: 2,
        module: 'invoices',
      });

      const result = await removePermission.execute(2, 'invoices', actor);

      expect(repo.removeOverride).toHaveBeenCalledWith(2, 'invoices');
      expect(result).toEqual({ removed: true });
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('is a no-op (no audit entry) when there is nothing to remove', async () => {
      repo.findRoleById.mockResolvedValue(roles[1]);
      repo.findOverride.mockResolvedValue(null);

      await removePermission.execute(2, 'invoices', actor);

      expect(repo.removeOverride).toHaveBeenCalledWith(2, 'invoices');
      expect(audit.write).not.toHaveBeenCalled();
    });
  });
});
