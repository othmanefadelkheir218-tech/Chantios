import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { InvitationRepository } from '../repositories/invitation.repository';
import { AcceptInvitationHandler } from './accept-invitation.handler';
import { CreateDirectMemberHandler } from './create-direct-member.handler';
import { CreateInvitationHandler } from './create-invitation.handler';
import { RevokeInvitationHandler } from './revoke-invitation.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const invitation = (over: Record<string, unknown> = {}) => ({
  id: 1,
  tenantId: 1,
  email: 'invitee@test.local',
  name: 'Invitee',
  roleId: 5,
  tokenHash: 'hash',
  invitedBy: 1,
  expiresAt: new Date(Date.now() + 86_400_000),
  acceptedAt: null,
  createdAt: new Date(),
  ...over,
});

describe('Invitations handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByHash: jest.fn(),
    findOpenByEmailAnywhere: jest.fn(),
    markAccepted: jest.fn(),
    delete: jest.fn(),
  };
  const users = {
    findByEmail: jest.fn(),
    findByLoginCode: jest.fn(),
    create: jest.fn(),
  };
  const email = { send: jest.fn() };
  const audit = { write: jest.fn() };
  const tenantContext = { setTenantId: jest.fn() };
  const prisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ name: 'Acme', locale: 'en' }),
    },
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateInvitationHandler;
  let accept: AcceptInvitationHandler;
  let revoke: RevokeInvitationHandler;
  let direct: CreateDirectMemberHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    prisma.tenant.findUnique.mockResolvedValue({ name: 'Acme', locale: 'en' });
    const handlers = [
      CreateInvitationHandler,
      AcceptInvitationHandler,
      RevokeInvitationHandler,
      CreateDirectMemberHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: InvitationRepository, useValue: repo },
        { provide: UsersService, useValue: users },
        { provide: EmailService, useValue: email },
        { provide: AuditService, useValue: audit },
        { provide: TenantContextService, useValue: tenantContext },
        { provide: PrismaService, useValue: prisma },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateInvitationHandler);
    accept = module.get(AcceptInvitationHandler);
    revoke = module.get(RevokeInvitationHandler);
    direct = module.get(CreateDirectMemberHandler);
  });

  describe('CreateInvitationHandler', () => {
    it('refuses an email already used by an existing user', async () => {
      users.findByEmail.mockResolvedValue({ id: 9 });
      await expect(
        create.execute(
          { email: 'taken@test.local', name: 'X', role_id: 5 },
          actor,
        ),
      ).rejects.toThrow(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('refuses an open invitation at another company', async () => {
      users.findByEmail.mockResolvedValue(null);
      repo.findOpenByEmailAnywhere.mockResolvedValue(
        invitation({ tenantId: 2 }),
      );
      await expect(
        create.execute(
          { email: 'invitee@test.local', name: 'X', role_id: 5 },
          actor,
        ),
      ).rejects.toThrow(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('replaces the old row when re-inviting the same email at the same company', async () => {
      users.findByEmail.mockResolvedValue(null);
      repo.findOpenByEmailAnywhere.mockResolvedValue(
        invitation({ id: 7, tenantId: 1 }),
      );
      repo.create.mockResolvedValue(invitation({ id: 8 }));

      await create.execute(
        { email: 'invitee@test.local', name: 'Invitee', role_id: 5 },
        actor,
      );

      expect(repo.delete).toHaveBeenCalledWith(7);
      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(email.send).toHaveBeenCalledTimes(1);
    });

    it('creates a fresh invitation and emails it', async () => {
      users.findByEmail.mockResolvedValue(null);
      repo.findOpenByEmailAnywhere.mockResolvedValue(null);
      repo.create.mockResolvedValue(invitation());

      const result = await create.execute(
        { email: 'invitee@test.local', name: 'Invitee', role_id: 5 },
        actor,
      );

      expect(result.email).toBe('invitee@test.local');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('AcceptInvitationHandler', () => {
    it('rejects an invalid token', async () => {
      repo.findByHash.mockResolvedValue(null);
      await expect(
        accept.execute({ token: 'bad', password: 'LongEnough123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an already-accepted invitation', async () => {
      repo.findByHash.mockResolvedValue(invitation({ acceptedAt: new Date() }));
      await expect(
        accept.execute({ token: 'used', password: 'LongEnough123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired invitation', async () => {
      repo.findByHash.mockResolvedValue(
        invitation({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(
        accept.execute({ token: 'expired', password: 'LongEnough123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the user, sets the tenant in context, and marks the invitation accepted', async () => {
      repo.findByHash.mockResolvedValue(invitation());
      users.create.mockResolvedValue({
        id: 42,
        email: 'invitee@test.local',
        roleId: 5,
      });

      const result = await accept.execute({
        token: 'good',
        password: 'LongEnough123',
      });

      expect(tenantContext.setTenantId).toHaveBeenCalledWith(1);
      expect(users.create).toHaveBeenCalledTimes(1);
      expect(repo.markAccepted).toHaveBeenCalledWith(1);
      expect(result).toEqual({ accepted: true, user_id: 42 });
    });
  });

  describe('RevokeInvitationHandler', () => {
    it('refuses to revoke an already-accepted invitation', async () => {
      repo.findById.mockResolvedValue(invitation({ acceptedAt: new Date() }));
      await expect(revoke.execute(1, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('deletes an open invitation', async () => {
      repo.findById.mockResolvedValue(invitation());
      const result = await revoke.execute(1, actor);
      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ revoked: true });
    });
  });

  describe('CreateDirectMemberHandler (auth-tokens.md § 2b)', () => {
    const created = (over: Record<string, unknown> = {}) => ({
      id: 30,
      tenantId: 1,
      roleId: 5,
      name: 'Jean',
      email: null,
      loginCode: null,
      mustChangePassword: false,
      phone: null,
      hourlyRate: '0',
      isActive: true,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...over,
    });

    it('email + temporary password: user created with must_change_password, no email sent', async () => {
      users.findByEmail.mockResolvedValue(null);
      repo.findOpenByEmailAnywhere.mockResolvedValue(null);
      users.create.mockResolvedValue(
        created({ roleId: 2, email: 'm@test.local', mustChangePassword: true }),
      );
      const result = await direct.execute(
        {
          name: 'Jean',
          role_id: 2,
          email: 'M@test.local',
          password: 'Temp@12345678',
        },
        actor,
      );
      const data = (users.create.mock.calls[0] as [Record<string, unknown>])[0];
      expect(data).toMatchObject({
        email: 'm@test.local',
        roleId: 2,
        mustChangePassword: true,
      });
      expect(data.passwordHash).toEqual(expect.any(String));
      expect(data.passwordHash).not.toBe('Temp@12345678');
      expect(data.loginCode).toBeUndefined();
      expect(email.send).not.toHaveBeenCalled();
      expect(result.mustChangePassword).toBe(true);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'user',
          entityId: 30,
        }),
      );
    });

    it('a used email is refused, nothing created', async () => {
      users.findByEmail.mockResolvedValue({ id: 9 });
      await expect(
        direct.execute(
          {
            name: 'X',
            role_id: 2,
            email: 'taken@test.local',
            password: 'Temp@12345678',
          },
          actor,
        ),
      ).rejects.toThrow(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('replaces an open invitation of the same email at this company', async () => {
      users.findByEmail.mockResolvedValue(null);
      repo.findOpenByEmailAnywhere.mockResolvedValue(
        invitation({ id: 7, tenantId: 1 }),
      );
      users.create.mockResolvedValue(created({ email: 'invitee@test.local' }));
      await direct.execute(
        {
          name: 'X',
          role_id: 5,
          email: 'invitee@test.local',
          password: 'Temp@12345678',
        },
        actor,
      );
      expect(repo.delete).toHaveBeenCalledWith(7);
    });

    it('worker without email: PIN hashed + a free 8-digit login code', async () => {
      users.findByLoginCode
        .mockResolvedValueOnce({ id: 3 })
        .mockResolvedValue(null);
      users.create.mockResolvedValue(created({ loginCode: '12345678' }));
      await direct.execute({ name: 'Jean', role_id: 5, pin: '1234' }, actor);
      const data = (users.create.mock.calls[0] as [Record<string, unknown>])[0];
      expect(data.email).toBeNull();
      expect(data.loginCode).toMatch(/^\d{8}$/);
      expect(data.mobilePinHash).toEqual(expect.any(String));
      expect(data.passwordHash).toBeUndefined();
      expect(users.findByLoginCode).toHaveBeenCalledTimes(2);
      expect(users.findByEmail).not.toHaveBeenCalled();
    });

    it('a manager without email is refused', async () => {
      await expect(
        direct.execute({ name: 'X', role_id: 2, pin: '1234' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });
});
