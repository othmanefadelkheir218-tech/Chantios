import { BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ImpersonateEnterHandler } from './impersonate-enter.handler';
import { ImpersonateExitHandler } from './impersonate-exit.handler';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

const adminActor = { adminUserId: 9, ip: '10.0.0.1' };

const admin = (over: Record<string, unknown> = {}) => ({
  id: 2,
  tenantId: 1,
  roleId: 1,
  email: 'admin@tenant.test',
  ...over,
});

describe('ImpersonateEnterHandler — step 16', () => {
  const users = { findFirstActiveByRole: jest.fn() };
  const tokens = {
    signAccessToken: jest.fn().mockReturnValue('signed.token'),
  };
  const audit = { write: jest.fn() };
  const cookieFn = jest.fn();
  const fakeRes = { cookie: cookieFn } as unknown as Response;

  const handler = () =>
    new ImpersonateEnterHandler(
      logger as never,
      users as never,
      tokens as never,
      audit as never,
    );

  beforeEach(() => {
    jest.resetAllMocks();
    tokens.signAccessToken.mockReturnValue('signed.token');
  });

  it('writes the audit row BEFORE the cookie is set — call order matters', async () => {
    users.findFirstActiveByRole.mockResolvedValue(admin());
    const order: string[] = [];
    audit.write.mockImplementation(() => {
      order.push('audit');
      return Promise.resolve();
    });
    cookieFn.mockImplementation(() => order.push('cookie'));

    await handler().execute(1, adminActor, fakeRes);

    expect(order).toEqual(['audit', 'cookie']);
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 1,
        adminUserId: 9,
        action: 'impersonate_enter',
        entityType: 'tenant',
        entityId: 1,
      }),
    );
  });

  it('finds the tenant own active admin-role user (role id 1), not any other role', async () => {
    users.findFirstActiveByRole.mockResolvedValue(admin());
    await handler().execute(5, adminActor, fakeRes);
    expect(users.findFirstActiveByRole).toHaveBeenCalledWith(5, 1);
  });

  it('signs a normal user token carrying impersonatedBy, no refresh token issued', async () => {
    users.findFirstActiveByRole.mockResolvedValue(admin({ id: 7, roleId: 1 }));
    await handler().execute(5, adminActor, fakeRes);
    expect(tokens.signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 7,
        tenantId: 5,
        roleId: 1,
        impersonatedBy: 9,
      }),
    );
    expect(cookieFn).toHaveBeenCalledWith(
      'access_token',
      'signed.token',
      expect.any(Object),
    );
    // Only the access_token cookie — never a refresh_token cookie.
    expect(cookieFn).toHaveBeenCalledTimes(1);
  });

  it('no active admin user in the tenant -> 400, nothing audited, no cookie', async () => {
    users.findFirstActiveByRole.mockResolvedValue(null);
    await expect(handler().execute(5, adminActor, fakeRes)).rejects.toThrow(
      BadRequestException,
    );
    expect(audit.write).not.toHaveBeenCalled();
    expect(cookieFn).not.toHaveBeenCalled();
  });

  it('no platform admin session on the request -> 400', async () => {
    await expect(
      handler().execute(5, { adminUserId: null, ip: null }, fakeRes),
    ).rejects.toThrow(BadRequestException);
    expect(users.findFirstActiveByRole).not.toHaveBeenCalled();
  });

  it('a failing audit write stops the handler before any cookie is set', async () => {
    users.findFirstActiveByRole.mockResolvedValue(admin());
    audit.write.mockRejectedValue(new Error('db down'));
    await expect(handler().execute(1, adminActor, fakeRes)).rejects.toThrow(
      'db down',
    );
    expect(cookieFn).not.toHaveBeenCalled();
  });
});

describe('ImpersonateExitHandler — step 16', () => {
  const tokens = { verifyAccessToken: jest.fn() };
  const audit = { write: jest.fn() };
  const clearCookieFn = jest.fn();
  const fakeRes = { clearCookie: clearCookieFn } as unknown as Response;
  const reqWithCookie = (token?: string) =>
    ({ cookies: token ? { access_token: token } : {} }) as unknown as Request;

  const handler = () =>
    new ImpersonateExitHandler(
      logger as never,
      tokens as never,
      audit as never,
    );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('writes the audit row BEFORE clearing cookies — call order matters', async () => {
    tokens.verifyAccessToken.mockReturnValue({ tenantId: 5 });
    const order: string[] = [];
    audit.write.mockImplementation(() => {
      order.push('audit');
      return Promise.resolve();
    });
    clearCookieFn.mockImplementation(() => order.push('cookie'));

    await handler().execute(reqWithCookie('abc'), adminActor, fakeRes);

    // clearAuthCookies clears BOTH access_token and refresh_token — two
    // 'cookie' entries, both after the single 'audit' entry.
    expect(order).toEqual(['audit', 'cookie', 'cookie']);
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 5,
        adminUserId: 9,
        action: 'impersonate_exit',
        entityType: 'tenant',
        entityId: 5,
      }),
    );
  });

  it('recovers the tenant id from the still-present access_token cookie', async () => {
    tokens.verifyAccessToken.mockReturnValue({ tenantId: 42 });
    await handler().execute(reqWithCookie('abc'), adminActor, fakeRes);
    expect(tokens.verifyAccessToken).toHaveBeenCalledWith('abc');
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 42, entityId: 42 }),
    );
  });

  it('an expired/invalid/missing cookie still writes the exit row, with tenantId null', async () => {
    tokens.verifyAccessToken.mockImplementation(() => {
      throw new Error('expired');
    });
    await handler().execute(reqWithCookie('expired'), adminActor, fakeRes);
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: null, entityId: null }),
    );
    expect(clearCookieFn).toHaveBeenCalled();
  });

  it('a failing audit write leaves the cookies untouched and the request fails', async () => {
    tokens.verifyAccessToken.mockReturnValue({ tenantId: 5 });
    audit.write.mockRejectedValue(new Error('db down'));
    await expect(
      handler().execute(reqWithCookie('abc'), adminActor, fakeRes),
    ).rejects.toThrow('db down');
    expect(clearCookieFn).not.toHaveBeenCalled();
  });
});
