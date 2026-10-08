import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { hashCode } from './helpers/one-time-code.helper';
import { OneTimeCodesService } from './one-time-codes.service';
import { OneTimeCodeRepository } from './repositories/one-time-code.repository';

const scope = { tenantId: 1 };

describe('OneTimeCodesService', () => {
  const repo = {
    create: jest.fn(),
    findActive: jest.fn(),
    consumePriorActive: jest.fn(),
    incrementAttempt: jest.fn(),
    markConsumed: jest.fn(),
    takeAttempt: jest.fn(),
  };
  const logger = { info: jest.fn(), warn: jest.fn() };
  let service: OneTimeCodesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        OneTimeCodesService,
        { provide: OneTimeCodeRepository, useValue: repo },
        { provide: getLoggerToken(OneTimeCodesService.name), useValue: logger },
      ],
    }).compile();
    service = module.get(OneTimeCodesService);
  });

  describe('generate', () => {
    it('invalidates any prior active code, then creates a fresh one', async () => {
      const code = await service.generate('email_verification', scope);

      expect(repo.consumePriorActive).toHaveBeenCalledWith(
        'email_verification',
        scope,
      );
      expect(code).toMatch(/^\d{6}$/);
      expect(repo.create).toHaveBeenCalledWith(
        'email_verification',
        scope,
        hashCode(code),
        expect.any(Date),
      );
    });
  });

  describe('verify', () => {
    it('returns false when there is no active code', async () => {
      repo.findActive.mockResolvedValue(null);
      await expect(
        service.verify('email_verification', scope, '123456'),
      ).resolves.toBe(false);
    });

    it('returns true and consumes the row on a matching code', async () => {
      repo.findActive.mockResolvedValue({
        id: 1,
        codeHash: hashCode('123456'),
        attemptCount: 0,
      });

      await expect(
        service.verify('email_verification', scope, '123456'),
      ).resolves.toBe(true);
      expect(repo.markConsumed).toHaveBeenCalledWith(1);
      expect(repo.incrementAttempt).not.toHaveBeenCalled();
    });

    it('increments the attempt count and stays usable on a wrong code (no limit for email_verification)', async () => {
      repo.findActive.mockResolvedValue({
        id: 1,
        codeHash: hashCode('123456'),
        attemptCount: 0,
      });

      await expect(
        service.verify('email_verification', scope, '000000'),
      ).resolves.toBe(false);
      expect(repo.incrementAttempt).toHaveBeenCalledWith(1);
      expect(repo.markConsumed).not.toHaveBeenCalled();
    });

    it('locks out a type with a max attempt count once reached', async () => {
      repo.findActive.mockResolvedValue({
        id: 1,
        codeHash: hashCode('123456'),
        attemptCount: 5,
      });

      await expect(
        service.verify('password_reset', { userId: 1 }, '123456'),
      ).resolves.toBe(false);
      expect(repo.markConsumed).toHaveBeenCalledWith(1);
    });
  });

  describe('challenge (admin 2FA)', () => {
    const adminScope = { adminUserId: 1 };

    it('opens a challenge with a random hash and returns its id', async () => {
      repo.create.mockResolvedValue({ id: 42 });

      await expect(
        service.openChallenge('admin_2fa', adminScope),
      ).resolves.toBe(42);
      expect(repo.consumePriorActive).toHaveBeenCalledWith(
        'admin_2fa',
        adminScope,
      );
      expect(repo.create).toHaveBeenCalledWith(
        'admin_2fa',
        adminScope,
        expect.stringMatching(/^[0-9a-f]{64}$/),
        expect.any(Date),
      );
    });

    it('allows a try while the challenge is the active one', async () => {
      repo.findActive.mockResolvedValue({ id: 7 });
      repo.takeAttempt.mockResolvedValue(true);

      await expect(
        service.takeChallengeAttempt('admin_2fa', adminScope, 7),
      ).resolves.toBe(true);
      expect(repo.takeAttempt).toHaveBeenCalledWith(7, 3);
    });

    it('refuses and consumes the challenge once the 3 tries are used', async () => {
      repo.findActive.mockResolvedValue({ id: 7 });
      repo.takeAttempt.mockResolvedValue(false);

      await expect(
        service.takeChallengeAttempt('admin_2fa', adminScope, 7),
      ).resolves.toBe(false);
      expect(repo.markConsumed).toHaveBeenCalledWith(7);
    });

    it('refuses an older challenge replaced by a newer login', async () => {
      repo.findActive.mockResolvedValue({ id: 8 });

      await expect(
        service.takeChallengeAttempt('admin_2fa', adminScope, 7),
      ).resolves.toBe(false);
      expect(repo.takeAttempt).not.toHaveBeenCalled();
    });

    it('refuses when no challenge is active (expired or already used)', async () => {
      repo.findActive.mockResolvedValue(null);

      await expect(
        service.takeChallengeAttempt('admin_2fa', adminScope, 7),
      ).resolves.toBe(false);
    });

    it('closes the challenge after a right answer', async () => {
      await service.closeChallenge(7);
      expect(repo.markConsumed).toHaveBeenCalledWith(7);
    });
  });
});
