import { CleanupExpiredTokensJob } from './cleanup-expired-tokens.job';

describe('CleanupExpiredTokensJob', () => {
  it('deletes tokens and codes expired more than 30 days ago', async () => {
    const sessions = { deleteExpiredOlderThan: jest.fn().mockResolvedValue(3) };
    const codes = { deleteExpiredOlderThan: jest.fn().mockResolvedValue(2) };
    const logger = { info: jest.fn(), error: jest.fn() };
    const job = new CleanupExpiredTokensJob(
      logger as never,
      sessions as never,
      codes as never,
    );

    const before = Date.now();
    const result = await job.run();
    const after = Date.now();

    expect(result).toEqual({ refreshTokens: 3, codes: 2 });
    const cutoff = (sessions.deleteExpiredOlderThan.mock.calls[0] as [Date])[0];
    const thirtyDays = 30 * 86_400_000;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - thirtyDays);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after - thirtyDays);
    expect(codes.deleteExpiredOlderThan).toHaveBeenCalledWith(cutoff);
  });

  it('never throws when the database fails', async () => {
    const sessions = {
      deleteExpiredOlderThan: jest.fn().mockRejectedValue(new Error('db')),
    };
    const codes = { deleteExpiredOlderThan: jest.fn() };
    const logger = { info: jest.fn(), error: jest.fn() };
    const job = new CleanupExpiredTokensJob(
      logger as never,
      sessions as never,
      codes as never,
    );
    await expect(job.run()).resolves.toEqual({ refreshTokens: 0, codes: 0 });
    expect(logger.error).toHaveBeenCalled();
  });
});
