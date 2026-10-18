import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import type { MediaService } from '../../media/media.service';
import type { ProjectsService } from '../../projects/projects.service';
import type { UsersService } from '../../users/users.service';
import { FindContactHandler } from './find-contact.handler';
import { ListContactsHandler } from './list-contacts.handler';

// Step 23 — doc/notes/contacts.md.

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as PinoLogger;

const row = (id: number, isActive = true) => ({
  id,
  name: `User ${id}`,
  email: `user${id}@test.be`,
  phone: null,
  isActive,
  roleId: 2,
  role: { name: 'manager' },
});

describe('contacts handlers', () => {
  const users = { findDirectory: jest.fn(), findDirectoryEntry: jest.fn() };
  const media = { findByEntityIds: jest.fn() };
  const projects = { findOpenForUser: jest.fn() };
  const list = new ListContactsHandler(
    logger,
    users as unknown as UsersService,
    media as unknown as MediaService,
  );
  const find = new FindContactHandler(
    logger,
    users as unknown as UsersService,
    media as unknown as MediaService,
    projects as unknown as ProjectsService,
  );

  beforeEach(() => jest.clearAllMocks());

  describe('ListContactsHandler', () => {
    it('pages the cards, keeps inactive users and picks the newest avatar', async () => {
      users.findDirectory.mockResolvedValue([[row(1), row(2, false)], 22]);
      media.findByEntityIds.mockResolvedValue(
        new Map([[1, [{ fileUrl: 'old.png' }, { fileUrl: 'new.png' }]]]),
      );

      const result = await list.execute({ page: 2, limit: 20, search: ' jo ' });

      expect(users.findDirectory).toHaveBeenCalledWith('jo', 20, 20);
      expect(result.total).toBe(22);
      expect(result.data[0]).toEqual({
        id: 1,
        name: 'User 1',
        email: 'user1@test.be',
        phone: null,
        roleId: 2,
        role: 'manager',
        isActive: true,
        avatarUrl: 'new.png',
      });
      expect(result.data[1]).toMatchObject({
        isActive: false,
        avatarUrl: null,
      });
    });

    it('never sends the hourly rate', async () => {
      users.findDirectory.mockResolvedValue([
        [{ ...row(1), hourlyRate: '18.50' }],
        1,
      ]);
      media.findByEntityIds.mockResolvedValue(new Map());

      const result = await list.execute({ page: 1, limit: 20 });

      expect(result.data[0]).not.toHaveProperty('hourlyRate');
      expect(users.findDirectory).toHaveBeenCalledWith(undefined, 0, 20);
    });
  });

  describe('FindContactHandler', () => {
    it('404 when the user is not in this company', async () => {
      users.findDirectoryEntry.mockResolvedValue(null);
      await expect(find.execute(99)).rejects.toThrow(NotFoundException);
      expect(projects.findOpenForUser).not.toHaveBeenCalled();
    });

    it('returns the contact with their open projects', async () => {
      users.findDirectoryEntry.mockResolvedValue(row(4));
      media.findByEntityIds.mockResolvedValue(new Map());
      const open = [
        { id: 8, name: 'Rénovation Dubois', status: 'in_progress' },
      ];
      projects.findOpenForUser.mockResolvedValue(open);

      const result = await find.execute(4);

      expect(projects.findOpenForUser).toHaveBeenCalledWith(4);
      expect(result).toMatchObject({ id: 4, avatarUrl: null, projects: open });
      expect(result).not.toHaveProperty('hourlyRate');
    });
  });
});
