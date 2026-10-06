import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_MODULE_KEY } from '../decorators/module.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PermissionGuard } from './permission.guard';

const ROLE_IDS: Record<string, number> = {
  admin: 1,
  manager: 2,
  worker: 5,
};

function setup(opts: {
  roleName: string;
  module?: string;
  roles?: string[];
  method?: string;
  overrides?: object[];
}) {
  const reflector = new Reflector();
  jest
    .spyOn(reflector, 'getAllAndOverride')
    .mockImplementation((key: unknown) => {
      if (key === ROLES_KEY) return opts.roles;
      if (key === PERMISSION_MODULE_KEY) return opts.module;
      return undefined;
    });
  const rolesService = {
    findRoleById: jest.fn().mockResolvedValue({ name: opts.roleName }),
    findOverridesForRole: jest.fn().mockResolvedValue(opts.overrides ?? []),
  };
  const req: Record<string, unknown> = {
    method: opts.method ?? 'GET',
    user: { roleId: ROLE_IDS[opts.roleName] ?? 1, tenantId: 1, userId: 9 },
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };
  const guard = new PermissionGuard(reflector, rolesService as never);
  return { guard, req, context: context as never };
}

describe('PermissionGuard — scope', () => {
  it("a worker listing tasks gets scope 'own' on the request", async () => {
    const { guard, req, context } = setup({
      roleName: 'worker',
      module: 'tasks',
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.permissionScope).toBe('own');
  });

  it("a worker's time entries are 'own' too", async () => {
    const { guard, req, context } = setup({
      roleName: 'worker',
      module: 'time_entries',
    });
    await guard.canActivate(context);
    expect(req.permissionScope).toBe('own');
  });

  it("an admin and a manager listing tasks get scope 'all'", async () => {
    for (const roleName of ['admin', 'manager']) {
      const { guard, req, context } = setup({ roleName, module: 'tasks' });
      await guard.canActivate(context);
      expect(req.permissionScope).toBe('all');
    }
  });

  it("a tenant override can turn a worker's scope to 'all'", async () => {
    const { guard, req, context } = setup({
      roleName: 'worker',
      module: 'tasks',
      overrides: [
        {
          module: 'tasks',
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          scope: 'all',
        },
      ],
    });
    await guard.canActivate(context);
    expect(req.permissionScope).toBe('all');
  });

  it('a worker cannot open a module they have no view access to', async () => {
    const { guard, context } = setup({
      roleName: 'worker',
      module: 'invoices',
    });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
