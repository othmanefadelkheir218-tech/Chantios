import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { SessionsService } from '../../sessions/sessions.service';
import { UserRepository } from '../repositories/user.repository';
import { DeactivateUserHandler } from './deactivate-user.handler';
import { SetPinHandler } from './set-pin.handler';
import { UpdateProfileHandler } from './update-profile.handler';
import { UpdateUserHandler } from './update-user.handler';

/** Arguments of every call to a mock, typed. */
const callsOf = (fn: jest.Mock) => fn.mock.calls as unknown[][];

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const user = (over: Record<string, unknown> = {}) => ({
  id: 2,
  tenantId: 1,
  roleId: 5,
  name: 'Worker One',
  email: 'worker@test.local',
  phone: null,
  passwordHash: 'hash',
  mobilePinHash: null,
  failedPinCount: 0,
  hourlyRate: '0',
  isActive: true,
  emailVerifiedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('Users handlers', () => {
  const repo = {
    findById: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    setMobilePin: jest.fn(),
  };
  const sessions = { revokeAllForUser: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let updateUser: UpdateUserHandler;
  let updateProfile: UpdateProfileHandler;
  let deactivateUser: DeactivateUserHandler;
  let setPin: SetPinHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      UpdateUserHandler,
      UpdateProfileHandler,
      DeactivateUserHandler,
      SetPinHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: UserRepository, useValue: repo },
        { provide: SessionsService, useValue: sessions },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    updateUser = module.get(UpdateUserHandler);
    updateProfile = module.get(UpdateProfileHandler);
    deactivateUser = module.get(DeactivateUserHandler);
    setPin = module.get(SetPinHandler);
  });

  describe('UpdateUserHandler', () => {
    it('updates the user and writes one audit entry', async () => {
      repo.findById.mockResolvedValue(user());
      repo.update.mockResolvedValue(user({ roleId: 2, hourlyRate: '20.00' }));

      const result = await updateUser.execute(
        2,
        { role_id: 2, hourly_rate: '20.00' },
        actor,
      );

      expect(repo.update).toHaveBeenCalledWith(2, {
        roleId: 2,
        hourlyRate: '20.00',
      });
      expect(result.roleId).toBe(2);
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(callsOf(audit.write)[0][0]).toMatchObject({
        action: 'update',
        entityType: 'user',
        entityId: 2,
      });
    });

    it('rejects an unknown user', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(updateUser.execute(99, {}, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UpdateProfileHandler', () => {
    it('updates only name and phone, for the caller themselves', async () => {
      repo.findById.mockResolvedValue(user());
      repo.update.mockResolvedValue(user({ name: 'New Name' }));

      const result = await updateProfile.execute({ name: 'New Name' }, actor);

      expect(repo.update).toHaveBeenCalledWith(actor.userId, {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
    });
  });

  describe('DeactivateUserHandler', () => {
    it('sets is_active false and revokes every session', async () => {
      repo.findById.mockResolvedValue(user());
      repo.setActive.mockResolvedValue(user({ isActive: false }));

      const result = await deactivateUser.execute(2, actor);

      expect(repo.setActive).toHaveBeenCalledWith(2, false);
      expect(sessions.revokeAllForUser).toHaveBeenCalledWith(2);
      expect(result.isActive).toBe(false);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown user', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(deactivateUser.execute(99, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('SetPinHandler', () => {
    it('rejects a non-worker role', async () => {
      repo.findById.mockResolvedValue(user({ roleId: 1 }));
      await expect(setPin.execute(2, { pin: '1234' }, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.setMobilePin).not.toHaveBeenCalled();
    });

    it('hashes and sets the PIN for a worker', async () => {
      repo.findById.mockResolvedValue(user({ roleId: 5 }));
      repo.setMobilePin.mockResolvedValue(
        user({ roleId: 5, mobilePinHash: 'hashed' }),
      );

      const result = await setPin.execute(2, { pin: '1234' }, actor);

      expect(repo.setMobilePin).toHaveBeenCalledWith(2, expect.any(String));
      expect(callsOf(repo.setMobilePin)[0][1]).not.toBe('1234');
      expect(result.id).toBe(2);
    });

    it('rejects an unknown user', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(setPin.execute(99, { pin: '1234' }, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
