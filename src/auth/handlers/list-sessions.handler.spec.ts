import { ListSessionsHandler } from './list-sessions.handler';

describe('ListSessionsHandler', () => {
  it('never returns the token hash', async () => {
    const sessions = {
      listLiveForUser: jest.fn().mockResolvedValue([
        {
          id: 5,
          userId: 15,
          adminUserId: null,
          tokenHash: 'secret-hash',
          userAgent: 'curl',
          ipAddress: '::1',
          createdAt: new Date(),
          expiresAt: new Date(),
          revokedAt: null,
        },
      ]),
    };
    const handler = new ListSessionsHandler(sessions as never);

    const result = await handler.execute({ userId: 15 } as never);

    expect(sessions.listLiveForUser).toHaveBeenCalledWith(15);
    expect(JSON.stringify(result)).not.toContain('secret-hash');
    expect(result[0]).toMatchObject({ id: 5, userAgent: 'curl' });
  });
});
