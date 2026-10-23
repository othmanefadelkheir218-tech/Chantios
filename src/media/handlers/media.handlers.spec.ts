import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { MediaRepository } from '../repositories/media.repository';

const uploadMock = jest.fn();
const deleteMock = jest.fn();

jest.mock('../../config/imagekit.config', () => ({
  imagekit: {
    files: { upload: uploadMock, delete: deleteMock },
  },
}));

jest.mock('@imagekit/nodejs', () => ({
  toFile: jest.fn().mockResolvedValue('mock-file'),
}));

import { DeleteMediaByEntityHandler } from './delete-media-by-entity.handler';
import { FindMediaHandler } from './find-media.handler';
import { HardDeleteMediaHandler } from './hard-delete-media.handler';
import { RenameMediaHandler } from './rename-media.handler';
import { ReplaceMediaHandler } from './replace-media.handler';
import { RestoreMediaHandler } from './restore-media.handler';
import { SoftDeleteMediaHandler } from './soft-delete-media.handler';
import { StorageUsageHandler } from './storage-usage.handler';
import { UploadMediaHandler } from './upload-media.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const media = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  entityType: 'report',
  entityId: 5,
  fileName: 'photo.jpg',
  fileId: 'ik_file_1',
  fileUrl: 'https://ik.io/photo.jpg',
  fileType: 'image/jpeg',
  fileSize: BigInt(2048),
  isLocked: false,
  uploadedBy: 1,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const file = (over: Record<string, unknown> = {}) =>
  ({
    buffer: Buffer.from('fake'),
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 2048,
    ...over,
  }) as Express.Multer.File;

describe('Media handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findVisibleById: jest.fn(),
    findByEntity: jest.fn(),
    findAllForEntity: jest.fn(),
    findByEntityAndType: jest.fn(),
    findManyByIds: jest.fn(),
    findMany: jest.fn(),
    rename: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    hardDelete: jest.fn(),
    findExpiredTrash: jest.fn(),
    hardDeleteUnscoped: jest.fn(),
    sumFileSize: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const tenants = { setLogoMediaId: jest.fn() };
  const roles = { findRoleById: jest.fn() };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  let uploadMedia: UploadMediaHandler;
  let findMedia: FindMediaHandler;
  let renameMedia: RenameMediaHandler;
  let softDeleteMedia: SoftDeleteMediaHandler;
  let hardDeleteMedia: HardDeleteMediaHandler;
  let restoreMedia: RestoreMediaHandler;
  let replaceMedia: ReplaceMediaHandler;
  let storageUsage: StorageUsageHandler;
  let deleteMediaByEntity: DeleteMediaByEntityHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      UploadMediaHandler,
      FindMediaHandler,
      RenameMediaHandler,
      SoftDeleteMediaHandler,
      HardDeleteMediaHandler,
      RestoreMediaHandler,
      ReplaceMediaHandler,
      StorageUsageHandler,
      DeleteMediaByEntityHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: MediaRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        { provide: TenantsService, useValue: tenants },
        { provide: RolesService, useValue: roles },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    uploadMedia = module.get(UploadMediaHandler);
    findMedia = module.get(FindMediaHandler);
    renameMedia = module.get(RenameMediaHandler);
    softDeleteMedia = module.get(SoftDeleteMediaHandler);
    hardDeleteMedia = module.get(HardDeleteMediaHandler);
    restoreMedia = module.get(RestoreMediaHandler);
    replaceMedia = module.get(ReplaceMediaHandler);
    storageUsage = module.get(StorageUsageHandler);
    deleteMediaByEntity = module.get(DeleteMediaByEntityHandler);
  });

  describe('UploadMediaHandler', () => {
    it('rejects a file over 10MB before calling ImageKit', async () => {
      await expect(
        uploadMedia.execute(
          file({ size: 11 * 1024 * 1024 }),
          { entity_type: 'report', entity_id: 1 },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(uploadMock).not.toHaveBeenCalled();
    });

    it('rejects a disallowed MIME type before calling ImageKit', async () => {
      await expect(
        uploadMedia.execute(
          file({ mimetype: 'application/pdf' }),
          { entity_type: 'report', entity_id: 1 },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(uploadMock).not.toHaveBeenCalled();
    });

    it('uploads to ImageKit then writes one row', async () => {
      uploadMock.mockResolvedValue({
        fileId: 'ik_new',
        url: 'https://ik.io/new.jpg',
      });
      repo.create.mockResolvedValue(media());

      const result = await uploadMedia.execute(
        file(),
        { entity_type: 'report', entity_id: 5 },
        actor,
      );

      expect(uploadMock).toHaveBeenCalledTimes(1);
      expect(uploadMock).toHaveBeenCalledWith(
        expect.objectContaining({ folder: '/Chantios/tenant-1/report/5' }),
        expect.objectContaining({ timeout: 30_000, maxRetries: 2 }),
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          entityType: 'report',
          entityId: 5,
          fileId: 'ik_new',
          fileUrl: 'https://ik.io/new.jpg',
        }),
      );
      expect(result.id).toBe(10);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('returns 502, not 500, when ImageKit fails — and writes no row', async () => {
      uploadMock.mockRejectedValue(new Error('timeout'));

      await expect(
        uploadMedia.execute(
          file(),
          { entity_type: 'report', entity_id: 5 },
          actor,
        ),
      ).rejects.toThrow(BadGatewayException);
      expect(repo.create).not.toHaveBeenCalled();
      expect(audit.write).not.toHaveBeenCalled();
    });

    it('returns 502 when ImageKit answers without a file id', async () => {
      uploadMock.mockResolvedValue({});

      await expect(
        uploadMedia.execute(
          file(),
          { entity_type: 'report', entity_id: 5 },
          actor,
        ),
      ).rejects.toThrow(BadGatewayException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('removes the ImageKit file when the row cannot be written', async () => {
      uploadMock.mockResolvedValue({
        fileId: 'ik_orphan',
        url: 'https://ik.io/orphan.jpg',
      });
      repo.create.mockRejectedValue(new Error('db down'));

      await expect(
        uploadMedia.execute(
          file(),
          { entity_type: 'report', entity_id: 5 },
          actor,
        ),
      ).rejects.toThrow('db down');
      expect(deleteMock).toHaveBeenCalledWith('ik_orphan');
    });
  });

  describe('FindMediaHandler', () => {
    const asRole = (name: string) =>
      roles.findRoleById.mockResolvedValue({ id: 1, name });
    const listWhere = () =>
      (repo.findMany.mock.calls[0] as [Record<string, unknown>])[0];

    it('limits the list to the caller’s own uploads when scope is own', async () => {
      asRole('worker');
      repo.findMany.mockResolvedValue([[media()], 1]);

      await findMedia.execute({ page: 1, limit: 20 }, actor, 'own');

      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ uploadedBy: actor.userId }),
        0,
        20,
      );
    });

    it('does not filter by uploader when scope is all', async () => {
      asRole('manager');
      repo.findMany.mockResolvedValue([[media()], 1]);

      await findMedia.execute({ page: 1, limit: 20 }, actor, 'all');

      expect(listWhere().uploadedBy).toBeUndefined();
    });

    it('a non-admin sees only their own note files', async () => {
      asRole('manager');
      repo.findMany.mockResolvedValue([[], 0]);

      await findMedia.execute({ page: 1, limit: 20 }, actor, 'all');

      expect(listWhere().AND).toEqual([
        {
          OR: [
            { entityType: { notIn: ['note', 'email_attachment'] } },
            { entityType: 'note', uploadedBy: actor.userId },
          ],
        },
      ]);
    });

    it('the tenant admin sees every note file', async () => {
      asRole('admin');
      repo.findMany.mockResolvedValue([[], 0]);

      await findMedia.execute({ page: 1, limit: 20 }, actor, 'all');

      expect(listWhere().AND).toEqual([
        {
          OR: [
            { entityType: { notIn: ['note', 'email_attachment'] } },
            { entityType: 'note' },
          ],
        },
      ]);
    });

    it('an impersonating platform admin sees no note file', async () => {
      repo.findMany.mockResolvedValue([[], 0]);

      await findMedia.execute(
        { page: 1, limit: 20, entity_type: 'note' },
        { ...actor, impersonatedBy: 7 },
        'all',
      );

      expect(roles.findRoleById).not.toHaveBeenCalled();
      expect(listWhere()).toEqual(
        expect.objectContaining({
          entityType: 'note',
          AND: [{ entityType: { notIn: ['note', 'email_attachment'] } }],
        }),
      );
    });

    it('a search by entity_id never returns note files', async () => {
      asRole('admin');
      repo.findMany.mockResolvedValue([[], 0]);

      await findMedia.execute(
        { page: 1, limit: 20, entity_type: 'note', entity_id: 5 },
        actor,
        'all',
      );

      expect(listWhere().AND).toEqual([
        { entityType: { notIn: ['note', 'email_attachment'] } },
      ]);
    });

    it('a note file never carries its note id', async () => {
      asRole('admin');
      repo.findMany.mockResolvedValue([
        [media({ entityType: 'note', entityId: 9, uploadedBy: 2 })],
        1,
      ]);

      const page = await findMedia.execute(
        { page: 1, limit: 20 },
        actor,
        'all',
      );

      expect(page.data[0]).toEqual(
        expect.objectContaining({ entityType: 'note', entityId: null }),
      );
    });

    it('findOne rejects an unknown id', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findMedia.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('findOne without an actor (internal caller) never sees note files', async () => {
      repo.findById.mockResolvedValue(media());
      await findMedia.findOne(1);
      expect(repo.findVisibleById).not.toHaveBeenCalled();
    });

    it('findOne hides another uploaders file when scope is own', async () => {
      asRole('worker');
      repo.findVisibleById.mockResolvedValue(
        media({ uploadedBy: actor.userId + 1 }),
      );
      await expect(findMedia.findVisible(1, actor, 'own')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('findOne returns the callers own file when scope is own', async () => {
      asRole('worker');
      repo.findVisibleById.mockResolvedValue(
        media({ uploadedBy: actor.userId }),
      );
      await expect(
        findMedia.findVisible(1, actor, 'own'),
      ).resolves.toBeDefined();
    });

    it('findOne gives the admin a note file without its note id', async () => {
      asRole('admin');
      repo.findVisibleById.mockResolvedValue(
        media({ entityType: 'note', entityId: 9, uploadedBy: 2 }),
      );

      await expect(findMedia.findVisible(10, actor, 'all')).resolves.toEqual(
        expect.objectContaining({ entityType: 'note', entityId: null }),
      );
      expect(repo.findVisibleById).toHaveBeenCalledWith(10, {
        OR: [
          { entityType: { notIn: ['note', 'email_attachment'] } },
          { entityType: 'note' },
        ],
      });
    });

    it('findOne hides manager A’s note file from manager B', async () => {
      asRole('manager');
      repo.findVisibleById.mockResolvedValue(null);

      await expect(findMedia.findVisible(10, actor, 'all')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.findVisibleById).toHaveBeenCalledWith(10, {
        OR: [
          { entityType: { notIn: ['note', 'email_attachment'] } },
          { entityType: 'note', uploadedBy: actor.userId },
        ],
      });
    });
  });

  describe('RenameMediaHandler', () => {
    it('renames the file, file_url untouched', async () => {
      repo.findById.mockResolvedValue(media());
      repo.rename.mockResolvedValue(media({ fileName: 'new-name.jpg' }));

      const result = await renameMedia.execute(
        10,
        { file_name: 'new-name.jpg' },
        actor,
      );

      expect(repo.rename).toHaveBeenCalledWith(10, 'new-name.jpg');
      expect(result.fileName).toBe('new-name.jpg');
      expect(result.fileUrl).toBe(media().fileUrl);
    });

    it('rejects an unknown id', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        renameMedia.execute(99, { file_name: 'x' }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SoftDeleteMediaHandler', () => {
    it('skips a locked row but trashes the rest', async () => {
      repo.findManyByIds.mockResolvedValue([
        media({ id: 1, isLocked: false }),
        media({ id: 2, isLocked: true }),
      ]);
      repo.softDelete.mockResolvedValue([
        media({ id: 1, deletedAt: new Date() }),
      ]);

      const result = await softDeleteMedia.execute([1, 2], actor);

      expect(repo.softDelete).toHaveBeenCalledWith([1]);
      expect(result.skipped).toEqual([2]);
      expect(deleteMock).not.toHaveBeenCalled();
    });
  });

  describe('HardDeleteMediaHandler', () => {
    it('deletes ImageKit first, then the row, skipping locked ids', async () => {
      repo.findManyByIds.mockResolvedValue([
        media({ id: 1, fileId: 'a', isLocked: false }),
        media({ id: 2, fileId: 'b', isLocked: true }),
      ]);
      deleteMock.mockResolvedValue(undefined);
      repo.hardDelete.mockResolvedValue([media({ id: 1 })]);

      const result = await hardDeleteMedia.execute([1, 2], actor);

      expect(deleteMock).toHaveBeenCalledWith('a');
      expect(deleteMock).not.toHaveBeenCalledWith('b');
      expect(repo.hardDelete).toHaveBeenCalledWith([1]);
      expect(result.skipped).toEqual([2]);
    });

    it('keeps the row in the database when the ImageKit delete fails', async () => {
      repo.findManyByIds.mockResolvedValue([media({ id: 1, fileId: 'a' })]);
      deleteMock.mockRejectedValue(new Error('network down'));
      repo.hardDelete.mockResolvedValue([]);

      const result = await hardDeleteMedia.execute([1], actor);

      expect(repo.hardDelete).toHaveBeenCalledWith([]);
      expect(result.deleted).toEqual([]);
    });
  });

  describe('RestoreMediaHandler', () => {
    it('restores only the trashed ids in the batch', async () => {
      repo.findManyByIds.mockResolvedValue([
        media({ id: 1, deletedAt: new Date() }),
        media({ id: 2, deletedAt: null }),
      ]);
      repo.restore.mockResolvedValue([media({ id: 1, deletedAt: null })]);

      await restoreMedia.execute([1, 2], actor);

      expect(repo.restore).toHaveBeenCalledWith([1]);
    });
  });

  describe('ReplaceMediaHandler', () => {
    it('returns 502 and keeps the old file when ImageKit fails', async () => {
      repo.findByEntityAndType.mockResolvedValue(
        media({ id: 1, fileId: 'old-file', entityType: 'user', entityId: 7 }),
      );
      uploadMock.mockRejectedValue(new Error('timeout'));

      await expect(
        replaceMedia.execute('user', 7, file(), actor),
      ).rejects.toThrow(BadGatewayException);
      expect(deleteMock).not.toHaveBeenCalled();
      expect(repo.hardDelete).not.toHaveBeenCalled();
    });

    it('uploads the new file, then hard-deletes the old one', async () => {
      repo.findByEntityAndType.mockResolvedValue(
        media({ id: 1, fileId: 'old-file', entityType: 'user', entityId: 7 }),
      );
      uploadMock.mockResolvedValue({
        fileId: 'new-file',
        url: 'https://ik.io/new-avatar.jpg',
      });
      repo.create.mockResolvedValue(
        media({ id: 2, fileId: 'new-file', entityType: 'user', entityId: 7 }),
      );
      repo.hardDelete.mockResolvedValue([]);

      const result = await replaceMedia.execute('user', 7, file(), actor);

      expect(uploadMock).toHaveBeenCalledWith(
        expect.objectContaining({ folder: '/Chantios/tenant-1/user/7' }),
        expect.anything(),
      );
      expect(deleteMock).toHaveBeenCalledWith('old-file');
      expect(repo.hardDelete).toHaveBeenCalledWith([1]);
      expect(result.id).toBe(2);
      expect(tenants.setLogoMediaId).not.toHaveBeenCalled();
    });

    it('updates tenants.logo_media_id for entity_type tenant', async () => {
      repo.findByEntityAndType.mockResolvedValue(null);
      uploadMock.mockResolvedValue({
        fileId: 'logo-file',
        url: 'https://ik.io/logo.jpg',
      });
      repo.create.mockResolvedValue(
        media({ id: 3, entityType: 'tenant', entityId: 1 }),
      );

      await replaceMedia.execute('tenant', 1, file(), actor);

      expect(tenants.setLogoMediaId).toHaveBeenCalledWith(1, 3);
    });
  });

  describe('StorageUsageHandler', () => {
    it('sums file_size including trashed rows', async () => {
      repo.sumFileSize.mockResolvedValue(BigInt(10_485_760));

      const result = await storageUsage.execute();

      expect(result.bytes).toBe(10_485_760);
      expect(result.gb).toBeCloseTo(0.01, 2);
    });
  });

  describe('DeleteMediaByEntityHandler', () => {
    it('hard-deletes every unlocked row for the entity, skipping locked ones', async () => {
      repo.findAllForEntity.mockResolvedValue([
        media({ id: 1, fileId: 'a', isLocked: false }),
        media({ id: 2, fileId: 'b', isLocked: true }),
        media({ id: 3, fileId: 'c', isLocked: false, deletedAt: new Date() }),
      ]);
      deleteMock.mockResolvedValue(undefined);
      repo.hardDelete.mockResolvedValue([media({ id: 1 }), media({ id: 3 })]);

      const result = await deleteMediaByEntity.execute('project', 99, actor);

      expect(deleteMock).toHaveBeenCalledWith('a');
      expect(deleteMock).toHaveBeenCalledWith('c');
      expect(deleteMock).not.toHaveBeenCalledWith('b');
      expect(repo.hardDelete).toHaveBeenCalledWith([1, 3]);
      expect(result.skipped).toEqual([2]);
    });
  });
});
