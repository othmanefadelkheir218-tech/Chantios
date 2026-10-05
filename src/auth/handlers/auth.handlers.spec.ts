import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { getLoggerToken } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { EmailService } from '../../email/email.service';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { PlansService } from '../../plans/plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from '../../sessions/sessions.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/users.service';
import { TokenHelper } from '../helpers/token.helper';
import { ForgotPasswordHandler } from './forgot-password.handler';
import { LoginHandler } from './login.handler';
import { MobileLoginHandler } from './mobile-login.handler';
import { RefreshHandler } from './refresh.handler';
import { RegisterTenantHandler } from './register-tenant.handler';
import { ResetPasswordHandler } from './reset-password.handler';

const fakeReq = { headers: {}, ip: '127.0.0.1' } as unknown as Request;
const cookieFn = jest.fn();
const clearCookieFn = jest.fn();
const fakeRes = {
  cookie: cookieFn,
  clearCookie: clearCookieFn,
} as unknown as Response;

const user = (over: Record<string, unknown> = {}) => ({
  id: 2,
  tenantId: 1,
  roleId: 5,
  name: 'Worker',
  email: 'worker@test.local',
  phone: null,
  passwordHash: 'pw-hash',
  mobilePinHash: 'pin-hash',
  failedPinCount: 0,
  hourlyRate: '0',
  isActive: true,
  emailVerifiedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

jest.mock('../../common/helpers/password.helper', () => ({
  hashPassword: jest.fn((v: string) => Promise.resolve(`hashed:${v}`)),
  verifyPassword: jest.fn((hash: string, plain: string) =>
    Promise.resolve(hash === `valid:${plain}`),
  ),
}));

describe('Auth handlers', () => {
  const users = {
    findByEmail: jest.fn(),
    findByIdRaw: jest.fn(),
    create: jest.fn(),
    setPasswordHash: jest.fn(),
    bumpFailedPin: jest.fn(),
    resetFailedPin: jest.fn(),
  };
  const tenants = { findOne: jest.fn(), create: jest.fn() };
  const sessions = {
    issue: jest.fn(),
    findByHash: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  };
  const subscriptions = { create: jest.fn() };
  const plans = { findDefault: jest.fn() };
  const codes = { generate: jest.fn(), verify: jest.fn() };
  const email = { send: jest.fn() };
  const prisma = {
    $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
      Promise.resolve(cb({})),
    ),
    tenant: { findUnique: jest.fn().mockResolvedValue({ locale: 'en' }) },
  };
  const tokens = {
    signAccessToken: jest.fn(() => 'access-token'),
    signRefreshToken: jest.fn(() => ({ token: 'refresh-token', jti: 'jti-1' })),
    verifyRefreshToken: jest.fn(),
    sha256: jest.fn((v: string) => `sha256:${v}`),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let login: LoginHandler;
  let refresh: RefreshHandler;
  let mobileLogin: MobileLoginHandler;
  let registerTenant: RegisterTenantHandler;
  let forgotPassword: ForgotPasswordHandler;
  let resetPassword: ResetPasswordHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const handlers = [
      LoginHandler,
      RefreshHandler,
      MobileLoginHandler,
      RegisterTenantHandler,
      ForgotPasswordHandler,
      ResetPasswordHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: UsersService, useValue: users },
        { provide: TenantsService, useValue: tenants },
        { provide: SessionsService, useValue: sessions },
        { provide: SubscriptionsService, useValue: subscriptions },
        { provide: PlansService, useValue: plans },
        { provide: OneTimeCodesService, useValue: codes },
        { provide: AdminUsersService, useValue: {} },
        { provide: EmailService, useValue: email },
        { provide: PrismaService, useValue: prisma },
        { provide: TokenHelper, useValue: tokens },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    login = module.get(LoginHandler);
    refresh = module.get(RefreshHandler);
    mobileLogin = module.get(MobileLoginHandler);
    registerTenant = module.get(RegisterTenantHandler);
    forgotPassword = module.get(ForgotPasswordHandler);
    resetPassword = module.get(ResetPasswordHandler);
  });

  describe('LoginHandler', () => {
    it('rejects an unknown email', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(
        login.execute(
          { email: 'x@test.local', password: 'whatever' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a deactivated user', async () => {
      users.findByEmail.mockResolvedValue(user({ isActive: false }));
      await expect(
        login.execute(
          { email: 'worker@test.local', password: 'whatever' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a suspended tenant', async () => {
      users.findByEmail.mockResolvedValue(
        user({ passwordHash: 'valid:correct' }),
      );
      tenants.findOne.mockResolvedValue({ status: 'suspended' });
      await expect(
        login.execute(
          { email: 'worker@test.local', password: 'correct' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      users.findByEmail.mockResolvedValue(
        user({ passwordHash: 'valid:correct' }),
      );
      tenants.findOne.mockResolvedValue({ status: 'active' });
      await expect(
        login.execute(
          { email: 'worker@test.local', password: 'wrong' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('issues both cookies and a session on success', async () => {
      users.findByEmail.mockResolvedValue(
        user({ passwordHash: 'valid:correct' }),
      );
      tenants.findOne.mockResolvedValue({ status: 'active' });

      await login.execute(
        { email: 'worker@test.local', password: 'correct' },
        fakeReq,
        fakeRes,
      );

      expect(sessions.issue).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 2,
          tokenHash: 'sha256:refresh-token',
        }),
      );
      expect(cookieFn).toHaveBeenCalledWith(
        'access_token',
        'access-token',
        expect.anything(),
      );
      expect(cookieFn).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.anything(),
      );
    });
  });

  describe('RefreshHandler', () => {
    it('rejects when there is no refresh cookie', async () => {
      await expect(
        refresh.execute({ cookies: {} } as any, fakeRes),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('revokes every session when a revoked token is replayed', async () => {
      tokens.verifyRefreshToken.mockReturnValue({
        sub: 2,
        tenantId: 1,
        jti: 'x',
        kind: 'user',
      });
      sessions.findByHash.mockResolvedValue({
        id: 10,
        revokedAt: new Date(),
        expiresAt: new Date(),
      });

      await expect(
        refresh.execute(
          { cookies: { refresh_token: 'stolen' } } as any,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(sessions.revokeAllForUser).toHaveBeenCalledWith(2);
    });

    it('rotates on a valid, live token', async () => {
      tokens.verifyRefreshToken.mockReturnValue({
        sub: 2,
        tenantId: 1,
        jti: 'x',
        kind: 'user',
      });
      sessions.findByHash.mockResolvedValue({
        id: 10,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100_000),
      });
      users.findByIdRaw.mockResolvedValue(user());

      await refresh.execute(
        {
          cookies: { refresh_token: 'good' },
          headers: {},
          ip: '127.0.0.1',
        } as any,
        fakeRes,
      );

      expect(sessions.revoke).toHaveBeenCalledWith(10);
      expect(sessions.issue).toHaveBeenCalledTimes(1);
    });
  });

  describe('MobileLoginHandler', () => {
    it('rejects a non-worker role', async () => {
      users.findByEmail.mockResolvedValue(user({ roleId: 1 }));
      await expect(
        mobileLogin.execute(
          { email: 'worker@test.local', pin: '1234' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('locks out at the failed-PIN threshold', async () => {
      users.findByEmail.mockResolvedValue(user({ failedPinCount: 5 }));
      await expect(
        mobileLogin.execute(
          { email: 'worker@test.local', pin: '1234' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('bumps the failed count on a wrong PIN', async () => {
      users.findByEmail.mockResolvedValue(
        user({ mobilePinHash: 'valid:1234' }),
      );
      tenants.findOne.mockResolvedValue({ status: 'active' });
      users.bumpFailedPin.mockResolvedValue(1);

      await expect(
        mobileLogin.execute(
          { email: 'worker@test.local', pin: '0000' },
          fakeReq,
          fakeRes,
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(users.bumpFailedPin).toHaveBeenCalledWith(2);
    });

    it('resets the failed count and issues a session on the correct PIN', async () => {
      users.findByEmail.mockResolvedValue(
        user({ mobilePinHash: 'valid:1234' }),
      );
      tenants.findOne.mockResolvedValue({ status: 'active' });

      await mobileLogin.execute(
        { email: 'worker@test.local', pin: '1234' },
        fakeReq,
        fakeRes,
      );

      expect(users.resetFailedPin).toHaveBeenCalledWith(2);
      expect(sessions.issue).toHaveBeenCalledTimes(1);
    });
  });

  describe('RegisterTenantHandler', () => {
    it('refuses with no writes when there is no default plan', async () => {
      plans.findDefault.mockResolvedValue(null);
      await expect(
        registerTenant.execute({
          company_name: 'Acme',
          email: 'a@acme.test',
          password: 'LongEnough123',
          name: 'Admin',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates tenant + admin user + trialing subscription in one transaction', async () => {
      plans.findDefault.mockResolvedValue({ id: 2 });
      tenants.create.mockResolvedValue({ id: 10, email: 'a@acme.test' });
      users.create.mockResolvedValue(
        user({ id: 20, tenantId: 10, roleId: 1, email: 'a@acme.test' }),
      );
      codes.generate.mockResolvedValue('123456');

      const result = await registerTenant.execute({
        company_name: 'Acme',
        email: 'A@Acme.test',
        password: 'LongEnough123',
        name: 'Admin',
      });

      expect(tenants.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Acme', email: 'a@acme.test' }),
        expect.anything(),
        expect.anything(),
      );
      expect(subscriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 10,
          planId: 2,
          status: 'trialing',
        }),
        expect.anything(),
      );
      expect(email.send).toHaveBeenCalledTimes(1);
      expect(result.tenant_id).toBe(10);
    });
  });

  describe('ForgotPasswordHandler', () => {
    it('gives the same response for a known and an unknown email', async () => {
      users.findByEmail
        .mockResolvedValueOnce(user())
        .mockResolvedValueOnce(null);

      const known = await forgotPassword.execute({
        email: 'worker@test.local',
      });
      const unknown = await forgotPassword.execute({
        email: 'nobody@test.local',
      });

      expect(known).toEqual({ sent: true });
      expect(unknown).toEqual({ sent: true });
      expect(email.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('ResetPasswordHandler', () => {
    it('rejects an invalid code', async () => {
      users.findByEmail.mockResolvedValue(user());
      codes.verify.mockResolvedValue(false);
      await expect(
        resetPassword.execute({
          email: 'worker@test.local',
          code: '000000',
          password: 'NewPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('resets the password and revokes every session on a valid code', async () => {
      users.findByEmail.mockResolvedValue(user());
      codes.verify.mockResolvedValue(true);

      const result = await resetPassword.execute({
        email: 'worker@test.local',
        code: '123456',
        password: 'NewPassword123',
      });

      expect(users.setPasswordHash).toHaveBeenCalledWith(
        2,
        'hashed:NewPassword123',
      );
      expect(sessions.revokeAllForUser).toHaveBeenCalledWith(2);
      expect(result).toEqual({ reset: true });
    });
  });
});
