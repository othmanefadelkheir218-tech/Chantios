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
});
