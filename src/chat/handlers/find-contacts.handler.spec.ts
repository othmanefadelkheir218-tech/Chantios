import type { PinoLogger } from 'nestjs-pino';
import type { MediaService } from '../../media/media.service';
import type { UsersService } from '../../users/users.service';
import { FindContactsHandler } from './find-contacts.handler';

// chat-conversations.md § Contacts.

describe('FindContactsHandler', () => {
  const logger = { debug: jest.fn() } as unknown as PinoLogger;
  const users = { findActiveWithRole: jest.fn() };
  const media = { findByEntityIds: jest.fn() };
  const handler = new FindContactsHandler(
    logger,
    users as unknown as UsersService,
    media as unknown as MediaService,
  );
  const actor = { userId: 5, tenantId: 1, roleId: 5, email: 'w@test.local' };

  it('returns the active users with id, name, role and newest photo only', async () => {
    users.findActiveWithRole.mockResolvedValue([
      {
        id: 2,
        email: 'm@test.local',
        name: 'Manager',
        roleId: 2,
        roleName: 'manager',
      },
      {
        id: 5,
        email: 'w@test.local',
        name: 'Worker',
        roleId: 5,
        roleName: 'worker',
      },
    ]);

    media.findByEntityIds.mockResolvedValue(
      new Map([
        [
          2,
          [
            { fileUrl: 'https://img/old.png' },
            { fileUrl: 'https://img/new.png' },
          ],
        ],
      ]),
    );

    const result = await handler.execute(actor);

    expect(users.findActiveWithRole).toHaveBeenCalledWith();
    expect(media.findByEntityIds).toHaveBeenCalledWith('user', [2, 5]);
    expect(result).toEqual([
      {
        id: 2,
        name: 'Manager',
        role: 'manager',
        avatarUrl: 'https://img/new.png',
      },
      { id: 5, name: 'Worker', role: 'worker', avatarUrl: null },
    ]);
    expect(result.map((c) => Object.keys(c))).not.toContainEqual(
      expect.arrayContaining(['email']),
    );
  });
});
