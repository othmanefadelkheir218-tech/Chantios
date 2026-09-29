import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserHandler } from './create-user.handler';
import { DeleteUserHandler } from './delete-user.handler';
import { FindUserHandler } from './find-user.handler';
import { FindUsersHandler } from './find-users.handler';
import { UpdateUserHandler } from './update-user.handler';

const user = { id: 'u1', name: 'A', lastName: 'B', phone: '+212612345678' };

describe('Users handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByPhone: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateUserHandler;
  let findAll: FindUsersHandler;
  let update: UpdateUserHandler;
  let remove: DeleteUserHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateUserHandler,
      FindUsersHandler,
      FindUserHandler,
      UpdateUserHandler,
      DeleteUserHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: UserRepository, useValue: repo },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateUserHandler);
    findAll = module.get(FindUsersHandler);
    update = module.get(UpdateUserHandler);
    remove = module.get(DeleteUserHandler);
  });

  describe('CreateUserHandler', () => {
    it('creates a user', async () => {
      repo.findByPhone.mockResolvedValue(null);
      repo.create.mockResolvedValue(user);
      await expect(create.execute(user)).resolves.toEqual(user);
    });

    it('throws Conflict when the phone is already used', async () => {
      repo.findByPhone.mockResolvedValue(user);
      await expect(create.execute(user)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('FindUsersHandler', () => {
    it('returns a paginated list', async () => {
      repo.findMany.mockResolvedValue([[user], 45]);
      const result = await findAll.execute({ page: 2, limit: 20 });
      expect(repo.findMany).toHaveBeenCalledWith({}, 20, 20);
      expect(result).toMatchObject({ total: 45, page: 2, totalPages: 3 });
    });
  });

  describe('UpdateUserHandler', () => {
    it('throws NotFound when the user does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(update.execute('x', { name: 'A' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Conflict when the new phone belongs to someone else', async () => {
      repo.findById.mockResolvedValue(user);
      repo.findByPhone.mockResolvedValue({ ...user, id: 'u2' });
      await expect(
        update.execute('u1', { phone: '+212600000001' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates the user', async () => {
      repo.findById.mockResolvedValue(user);
      repo.update.mockResolvedValue({ ...user, name: 'C' });
      await expect(update.execute('u1', { name: 'C' })).resolves.toMatchObject({
        name: 'C',
      });
    });
  });

  describe('DeleteUserHandler', () => {
    it('throws NotFound when the user does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(remove.execute('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('deletes the user', async () => {
      repo.findById.mockResolvedValue(user);
      await remove.execute('u1');
      expect(repo.delete).toHaveBeenCalledWith('u1');
    });
  });
});
