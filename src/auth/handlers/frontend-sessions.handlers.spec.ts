import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { AdminUsersService } from '../../admin-users/admin-users.service';
import type { RolesService } from '../../roles/roles.service';
import type { SessionsService } from '../../sessions/sessions.service';
import type { UsersService } from '../../users/users.service';
import type { TokenHelper } from '../helpers/token.helper';
import type { AdminLoginHandler } from './admin-login.handler';
import { AdminRefreshHandler } from './admin-refresh.handler';
import { GetAdminMeHandler } from './get-admin-me.handler';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { GetMeHandler } from './get-me.handler';

// Step 18 — sessions seen by the frontend (doc/notes/auth-tokens.md).

const logger = { info: jest.fn(), warn: jest.fn() } as unknown as PinoLogger;

const admin = (over: Record<string, unknown> = {}) => ({
  id: 7,
  email: 'admin@test.local',
  name: 'Ada Admin',
  passwordHash: 'secret-hash',
  totpSecret: 'totp-secret',
  role: 'staff',
  isActive: true,
  canManageBilling: false,
  canManageTenants: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('AdminRefreshHandler — step 18', () => {
  const sessions = {
    findByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForAdmin: jest.fn(),
  };
  const adminUsers = { findByIdRaw: jest.fn() };
  const tokens = {
    verifyAdminRefreshToken: jest.fn(),
    sha256: jest.fn((v: string) => `hash:${v}`),
  };
  const adminLogin = { issueSession: jest.fn() };
  const clearCookie = jest.fn();
  const res = { clearCookie } as unknown as Response;
  const req = (cookie?: string) =>
    ({
      cookies: cookie ? { admin_refresh_token: cookie } : {},
      headers: {},
    }) as unknown as Request;

  const handler = new AdminRefreshHandler(
    logger,
    sessions as unknown as SessionsService,
    adminUsers as unknown as AdminUsersService,
    tokens as unknown as TokenHelper,
    adminLogin as unknown as AdminLoginHandler,
  );

  const liveSession = {
    id: 40,
    adminUserId: 7,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tokens.verifyAdminRefreshToken.mockReturnValue({ sub: 7, kind: 'admin' });
  });

  it('rotates: revokes the old session and issues a new one', async () => {
    sessions.findByHash.mockResolvedValue(liveSession);
    adminUsers.findByIdRaw.mockResolvedValue(admin());

    await expect(handler.execute(req('raw'), res)).resolves.toEqual({
      refreshed: true,
    });
    expect(sessions.findByHash).toHaveBeenCalledWith('hash:raw');
    expect(sessions.revoke).toHaveBeenCalledWith(40);
    expect(adminLogin.issueSession).toHaveBeenCalledWith(
      7,
      expect.anything(),
      res,
    );
  });

  it('401 without the cookie', async () => {
    await expect(handler.execute(req(), res)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(adminLogin.issueSession).not.toHaveBeenCalled();
  });

  it('a replayed revoked token revokes every session of that admin', async () => {
    sessions.findByHash.mockResolvedValue({
      ...liveSession,
      revokedAt: new Date(),
    });

    await expect(handler.execute(req('raw'), res)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessions.revokeAllForAdmin).toHaveBeenCalledWith(7);
    expect(clearCookie).toHaveBeenCalledWith(
      'admin_refresh_token',
      expect.anything(),
    );
    expect(adminLogin.issueSession).not.toHaveBeenCalled();
  });

  it('a tenant refresh token row is refused', async () => {
    sessions.findByHash.mockResolvedValue({
      ...liveSession,
      adminUserId: null,
    });

    await expect(handler.execute(req('raw'), res)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessions.revoke).not.toHaveBeenCalled();
  });

  it('an inactive admin gets 401 and the cookies cleared', async () => {
    sessions.findByHash.mockResolvedValue(liveSession);
    adminUsers.findByIdRaw.mockResolvedValue(admin({ isActive: false }));

    await expect(handler.execute(req('raw'), res)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(clearCookie).toHaveBeenCalled();
    expect(adminLogin.issueSession).not.toHaveBeenCalled();
  });

  it('an expired session row gets 401', async () => {
    sessions.findByHash.mockResolvedValue({
      ...liveSession,
      expiresAt: new Date(0),
    });

    await expect(handler.execute(req('raw'), res)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessions.revoke).not.toHaveBeenCalled();
  });
});

describe('GetAdminMeHandler — step 18', () => {
  const adminUsers = { findByIdRaw: jest.fn() };
  const handler = new GetAdminMeHandler(
    logger,
    adminUsers as unknown as AdminUsersService,
  );

  it('returns the admin without password_hash or totp_secret', async () => {
    adminUsers.findByIdRaw.mockResolvedValue(admin());

    const result = await handler.execute(7);
    expect(result).toMatchObject({
      id: 7,
      email: 'admin@test.local',
      name: 'Ada Admin',
      role: 'staff',
      canManageBilling: false,
      canManageTenants: true,
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('totpSecret');
  });

  it('401 for an inactive admin', async () => {
    adminUsers.findByIdRaw.mockResolvedValue(admin({ isActive: false }));
    await expect(handler.execute(7)).rejects.toThrow(UnauthorizedException);
  });
});

describe('GetMeHandler impersonation flag — step 18', () => {
  const users = {
    findByIdRaw: jest.fn().mockResolvedValue({
      id: 2,
      tenantId: 1,
      roleId: 5,
      name: 'Boss',
      email: 'boss@test.local',
      isActive: true,
    }),
  };
  const roles = {
    findRoleById: jest.fn().mockResolvedValue({ id: 5, name: 'admin' }),
    findOverridesForRole: jest.fn().mockResolvedValue([]),
  };
  const adminUsers = { findByIdRaw: jest.fn() };
  const subscriptions = {
    findByTenant: jest.fn().mockResolvedValue({
      status: 'past_due',
      periodEnd: new Date('2026-11-10T00:00:00Z'),
      graceEndsAt: new Date('2026-10-17T00:00:00Z'),
    }),
  };
  const handler = new GetMeHandler(
    logger,
    users as unknown as UsersService,
    roles as unknown as RolesService,
    adminUsers as unknown as AdminUsersService,
    subscriptions as unknown as SubscriptionsService,
  );
  const actor = { userId: 2, tenantId: 1, roleId: 5, email: 'boss@test.local' };

  it('is null for a normal login', async () => {
    const result = await handler.execute(actor);
    expect(result.impersonation).toBeNull();
    expect(adminUsers.findByIdRaw).not.toHaveBeenCalled();
  });

  it('carries the subscription status and grace date (step 20 banner)', async () => {
    const result = await handler.execute(actor);
    expect(result.subscription).toEqual({
      status: 'past_due',
      periodEnd: new Date('2026-11-10T00:00:00Z'),
      graceEndsAt: new Date('2026-10-17T00:00:00Z'),
    });
  });

  it('carries the admin and the token expiry while impersonating', async () => {
    adminUsers.findByIdRaw.mockResolvedValue(admin());
    const accessExpiresAt = new Date('2026-10-10T10:15:00Z');

    const result = await handler.execute({
      ...actor,
      impersonatedBy: 7,
      accessExpiresAt,
    });
    expect(result.impersonation).toEqual({
      adminUserId: 7,
      adminName: 'Ada Admin',
      expiresAt: accessExpiresAt,
    });
  });
});
