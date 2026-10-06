import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { MediaRepository } from '../repositories/media.repository';
import { AttachMediaHandler } from './attach-media.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'a@test.local' };
const tx = { marker: 'tx' } as never;

const file = (over: Record<string, unknown> = {}) => ({
  id: 7,
  tenantId: 1,
  entityType: 'message',
  entityId: 0,
  uploadedBy: 1,
  deletedAt: null,
  ...over,
});

describe('AttachMediaHandler', () => {
  const repo = { findManyByIds: jest.fn(), setEntityId: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  let handler: AttachMediaHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AttachMediaHandler,
        { provide: MediaRepository, useValue: repo },
        { provide: getLoggerToken(AttachMediaHandler.name), useValue: logger },
      ],
    }).compile();
    handler = module.get(AttachMediaHandler);
  });

  it('links pending files of this user to the new message, in the given tx', async () => {
    repo.findManyByIds.mockResolvedValue([file({ id: 7 }), file({ id: 8 })]);
    await handler.execute([7, 8], 'message', 100, actor, tx);
    expect(repo.setEntityId).toHaveBeenCalledWith([7, 8], 100, tx);
  });

  it('nothing to attach is a no-op', async () => {
    await handler.execute([], 'message', 100, actor, tx);
    expect(repo.findManyByIds).not.toHaveBeenCalled();
    expect(repo.setEntityId).not.toHaveBeenCalled();
  });

  it("refuses another user's file", async () => {
    repo.findManyByIds.mockResolvedValue([file({ uploadedBy: 2 })]);
    await expect(
      handler.execute([7], 'message', 100, actor, tx),
    ).rejects.toThrow(BadRequestException);
    expect(repo.setEntityId).not.toHaveBeenCalled();
  });

  it('refuses a file that is already attached to something', async () => {
    repo.findManyByIds.mockResolvedValue([file({ entityId: 55 })]);
    await expect(
      handler.execute([7], 'message', 100, actor, tx),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses a file of another entity type (a project photo is not a chat file)', async () => {
    repo.findManyByIds.mockResolvedValue([file({ entityType: 'project' })]);
    await expect(
      handler.execute([7], 'message', 100, actor, tx),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses a file in the trash, an unknown id, and the same id twice', async () => {
    repo.findManyByIds.mockResolvedValue([file({ deletedAt: new Date() })]);
    await expect(
      handler.execute([7], 'message', 100, actor, tx),
    ).rejects.toThrow(BadRequestException);

    repo.findManyByIds.mockResolvedValue([]);
    await expect(
      handler.execute([99], 'message', 100, actor, tx),
    ).rejects.toThrow(BadRequestException);

    await expect(
      handler.execute([7, 7], 'message', 100, actor, tx),
    ).rejects.toThrow(/only be attached once/);
  });

  it('one bad file attaches NONE of them', async () => {
    repo.findManyByIds.mockResolvedValue([
      file({ id: 7 }),
      file({ id: 8, uploadedBy: 5 }),
    ]);
    await expect(
      handler.execute([7, 8], 'message', 100, actor, tx),
    ).rejects.toThrow(BadRequestException);
    expect(repo.setEntityId).not.toHaveBeenCalled();
  });
});
