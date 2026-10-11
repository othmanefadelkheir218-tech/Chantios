import { ClsService } from 'nestjs-cls';
import { PinoLogger } from 'nestjs-pino';
import { AUDIT_SKIP_KEY } from '../../audit/helpers/audit.helper';
import { SessionsService } from '../../sessions/sessions.service';
import { AdminUserRepository } from '../repositories/admin-user.repository';
import { CreateAdminUserHandler } from './create-admin-user.handler';
import { DeactivateAdminUserHandler } from './deactivate-admin-user.handler';
import { UpdateAdminUserHandler } from './update-admin-user.handler';

const adminRow = (over: Record<string, unknown> = {}) => ({
  id: 2,
  email: 's@x.com',
  name: 'Sara',
  role: 'staff',
  isActive: true,
  canManageBilling: false,
  canManageTenants: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('admin users — can_manage_billing', () => {
  const admins = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
  const repo = admins as unknown as AdminUserRepository;

  beforeEach(() => jest.resetAllMocks());

  it('create: the right is off by default', async () => {
    admins.findByEmail.mockResolvedValue(null);
    admins.create.mockResolvedValue(adminRow());
    await new CreateAdminUserHandler(logger, repo).execute({
      email: 'S@x.com',
      name: 'Sara',
      password: 'a-long-password-1',
      role: 'staff',
    });
    expect(admins.create).toHaveBeenCalledWith(
      expect.objectContaining({ canManageBilling: false }),
    );
  });

  it('create: a super_admin can give the right at creation', async () => {
    admins.findByEmail.mockResolvedValue(null);
    admins.create.mockResolvedValue(adminRow({ canManageBilling: true }));
    const out = await new CreateAdminUserHandler(logger, repo).execute({
      email: 's@x.com',
      name: 'Sara',
      password: 'a-long-password-1',
      role: 'staff',
      can_manage_billing: true,
    });
    expect(admins.create).toHaveBeenCalledWith(
      expect.objectContaining({ canManageBilling: true }),
    );
    expect(out.canManageBilling).toBe(true);
  });

  it('update: switches the right on and off, including false', async () => {
    admins.findById.mockResolvedValue(adminRow());
    admins.update.mockResolvedValue(adminRow({ canManageBilling: true }));
    const handler = new UpdateAdminUserHandler(logger, repo);
    await handler.execute(2, { can_manage_billing: true });
    expect(admins.update).toHaveBeenLastCalledWith(2, {
      canManageBilling: true,
    });
    await handler.execute(2, { can_manage_billing: false });
    expect(admins.update).toHaveBeenLastCalledWith(2, {
      canManageBilling: false,
    });
  });

  it('update: leaves the right alone when the field is not sent', async () => {
    admins.findById.mockResolvedValue(adminRow());
    admins.update.mockResolvedValue(adminRow());
    await new UpdateAdminUserHandler(logger, repo).execute(2, { name: 'New' });
    expect(admins.update).toHaveBeenCalledWith(2, { name: 'New' });
  });
});

describe('admin users — can_manage_tenants', () => {
  const admins = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;
  const repo = admins as unknown as AdminUserRepository;

  beforeEach(() => jest.resetAllMocks());

  it('create: the right is off by default, on when a super_admin gives it', async () => {
    admins.findByEmail.mockResolvedValue(null);
    admins.create.mockResolvedValue(adminRow());
    const handler = new CreateAdminUserHandler(logger, repo);
    const base = {
      email: 's@x.com',
      name: 'Sara',
      password: 'a-long-password-1',
      role: 'staff' as const,
    };
    await handler.execute(base);
    expect(admins.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ canManageTenants: false }),
    );
    admins.create.mockResolvedValue(adminRow({ canManageTenants: true }));
    const out = await handler.execute({ ...base, can_manage_tenants: true });
    expect(admins.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ canManageTenants: true }),
    );
    expect(out.canManageTenants).toBe(true);
  });

  it('update: switches the right on and off, and ignores it when not sent', async () => {
    admins.findById.mockResolvedValue(adminRow());
    admins.update.mockResolvedValue(adminRow());
    const handler = new UpdateAdminUserHandler(logger, repo);
    await handler.execute(2, { can_manage_tenants: true });
    expect(admins.update).toHaveBeenLastCalledWith(2, {
      canManageTenants: true,
    });
    await handler.execute(2, { can_manage_tenants: false });
    expect(admins.update).toHaveBeenLastCalledWith(2, {
      canManageTenants: false,
    });
    await handler.execute(2, { name: 'New' });
    expect(admins.update).toHaveBeenLastCalledWith(2, { name: 'New' });
  });
});

describe('admin users — deactivate', () => {
  const admins = { findById: jest.fn(), deactivate: jest.fn() };
  const sessions = { revokeAllForAdmin: jest.fn() };
  const cls = { set: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn() } as unknown as PinoLogger;
  const handler = () =>
    new DeactivateAdminUserHandler(
      logger,
      admins as unknown as AdminUserRepository,
      sessions as unknown as SessionsService,
      cls as unknown as ClsService,
    );

  beforeEach(() => jest.resetAllMocks());

  it('deactivates an active admin and revokes the sessions', async () => {
    admins.findById.mockResolvedValue(adminRow());
    await handler().execute(2);
    expect(admins.deactivate).toHaveBeenCalledWith(2);
    expect(sessions.revokeAllForAdmin).toHaveBeenCalledWith(2);
    expect(cls.set).not.toHaveBeenCalled();
  });

  it('an admin that is already inactive changes nothing and skips the audit entry', async () => {
    admins.findById.mockResolvedValue(adminRow({ isActive: false }));
    await handler().execute(2);
    expect(admins.deactivate).not.toHaveBeenCalled();
    expect(cls.set).toHaveBeenCalledWith(AUDIT_SKIP_KEY, true);
  });
});
