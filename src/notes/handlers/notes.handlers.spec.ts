import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { callArg } from '../../common/testing/spec-helpers';
import { buildMediaFilter } from '../../media/helpers/media.helper';
import { MediaService } from '../../media/media.service';
import { NoImpersonationGuard } from '../guards/no-impersonation.guard';
import {
  buildNoteFilter,
  extractNoteText,
  resolvePinArchive,
  trashCutoff,
} from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';
import { CreateNoteHandler } from './create-note.handler';
import { DeleteNoteHandler } from './delete-note.handler';
import { FindNotesHandler } from './find-notes.handler';
import { NoteAccessHandler } from './note-access.handler';
import { NoteImagesHandler } from './note-images.handler';
import { NoteLabelsHandler } from './note-labels.handler';
import { TrashNoteHandler } from './trash-note.handler';
import { UpdateNoteHandler } from './update-note.handler';

const actor = { userId: 7, tenantId: 1, roleId: 5, email: 'w@test.local' };

const doc = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const note = (over: Record<string, unknown> = {}) => ({
  id: 3,
  tenantId: 1,
  userId: 7,
  title: 'Achats',
  content: doc('Vis 4x40'),
  contentText: 'Achats\nVis 4x40',
  color: 'default',
  isPinned: false,
  isArchived: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  labels: [],
  ...over,
});

describe('Notes helpers', () => {
  it('extractNoteText takes the title and every text node', () => {
    const content = {
      type: 'doc',
      content: [
        doc('Ligne un').content[0],
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [doc('Acheter du plâtre').content[0]],
            },
          ],
        },
      ],
    };
    expect(extractNoteText('Titre', content)).toBe(
      'Titre\nLigne un\nAcheter du plâtre',
    );
    expect(extractNoteText(null, null)).toBe('');
  });

  it('resolvePinArchive: pin brings an archived note back, archive unpins', () => {
    const archived = { isPinned: false, isArchived: true };
    expect(resolvePinArchive(archived, true)).toEqual({
      isPinned: true,
      isArchived: false,
    });
    expect(
      resolvePinArchive({ isPinned: true, isArchived: false }, undefined, true),
    ).toEqual({ isPinned: false, isArchived: true });
    expect(resolvePinArchive(archived)).toEqual(archived);
  });

  it('buildNoteFilter is always the owner, per view', () => {
    expect(buildNoteFilter(7, 'notes')).toEqual({
      userId: 7,
      deletedAt: null,
      isArchived: false,
    });
    expect(buildNoteFilter(7, 'trash')).toEqual({
      userId: 7,
      deletedAt: { not: null },
    });
    expect(buildNoteFilter(7, 'archive', 2, ' vis ')).toMatchObject({
      userId: 7,
      isArchived: true,
      labels: { some: { labelId: 2 } },
      contentText: { contains: 'vis', mode: 'insensitive' },
    });
  });

  it('trashCutoff is 7 days before now', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    expect(trashCutoff(now).toISOString()).toBe('2026-10-10T12:00:00.000Z');
  });

  it('the generic media filter never shows a note image', () => {
    // Without a viewer (step 26 B: owner or tenant admin), no note file.
    expect(buildMediaFilter()).toMatchObject({
      AND: [
        { entityType: { notIn: expect.arrayContaining(['note']) as string[] } },
      ],
    });
  });
});

describe('NoImpersonationGuard', () => {
  const ctx = (user: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('lets the user in, refuses an impersonation', () => {
    const guard = new NoImpersonationGuard();
    expect(guard.canActivate(ctx({ ...actor }))).toBe(true);
    expect(() =>
      guard.canActivate(ctx({ ...actor, impersonatedBy: 1 })),
    ).toThrow(ForbiddenException);
  });
});

describe('Notes handlers', () => {
  const repo = {
    findMany: jest.fn(),
    findOwn: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    setDeletedAt: jest.fn(),
    hardDelete: jest.fn(),
    findTrashedIds: jest.fn(),
    findTrashedBefore: jest.fn(),
    findLabels: jest.fn(),
    findOwnLabel: jest.fn(),
    countOwnLabels: jest.fn(),
    createLabel: jest.fn(),
    renameLabel: jest.fn(),
    deleteLabel: jest.fn(),
  };
  const media = {
    findByEntityIds: jest.fn(),
    upload: jest.fn(),
    deleteForEntity: jest.fn(),
    deleteAllForEntity: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let find: FindNotesHandler;
  let create: CreateNoteHandler;
  let update: UpdateNoteHandler;
  let trash: TrashNoteHandler;
  let remove: DeleteNoteHandler;
  let images: NoteImagesHandler;
  let labels: NoteLabelsHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    media.findByEntityIds.mockResolvedValue(new Map());
    const handlers = [
      NoteAccessHandler,
      FindNotesHandler,
      CreateNoteHandler,
      UpdateNoteHandler,
      TrashNoteHandler,
      DeleteNoteHandler,
      NoteImagesHandler,
      NoteLabelsHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: NoteRepository, useValue: repo },
        { provide: MediaService, useValue: media },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    find = module.get(FindNotesHandler);
    create = module.get(CreateNoteHandler);
    update = module.get(UpdateNoteHandler);
    trash = module.get(TrashNoteHandler);
    remove = module.get(DeleteNoteHandler);
    images = module.get(NoteImagesHandler);
    labels = module.get(NoteLabelsHandler);
  });

  it("someone else's note answers 404 — the lookup is by owner", async () => {
    repo.findOwn.mockResolvedValue(null);
    await expect(find.findOne(3, actor)).rejects.toThrow(NotFoundException);
    expect(repo.findOwn).toHaveBeenCalledWith(3, 7);
  });

  it('lists only the caller notes, with images, never content_text', async () => {
    repo.findMany.mockResolvedValue([[note()], 1]);
    media.findByEntityIds.mockResolvedValue(
      new Map([
        [3, [{ id: 9, fileUrl: 'https://ik/x.png', fileName: 'x.png' }]],
      ]),
    );
    const result = await find.execute(
      { page: 1, limit: 20, view: 'notes' },
      actor,
    );
    expect(callArg(repo.findMany, 0, 0)).toMatchObject({ userId: 7 });
    expect(result.total).toBe(1);
    expect(result.data[0].images).toEqual([
      { id: 9, fileUrl: 'https://ik/x.png', fileName: 'x.png' },
    ]);
    expect(result.data[0]).not.toHaveProperty('contentText');
  });

  it('create: builds the search text, owner = caller, audit without content', async () => {
    repo.countOwnLabels.mockResolvedValue(1);
    repo.create.mockResolvedValue(note());
    await create.execute(
      { title: '  Achats ', content: doc('Vis 4x40'), label_ids: [2, 2] },
      actor,
    );
    const data = callArg(repo.create, 0, 0);
    const labelIds = callArg(repo.create, 0, 1);
    expect(data).toMatchObject({
      tenantId: 1,
      userId: 7,
      title: 'Achats',
      contentText: 'Achats\nVis 4x40',
      color: 'default',
    });
    expect(labelIds).toEqual([2]);
    const entry = callArg(audit.write, 0, 0);
    expect(entry).toMatchObject({
      action: 'create',
      entityType: 'note',
      entityId: 3,
    });
    expect(entry).not.toHaveProperty('newValue');
  });

  it('create: an unknown label is 400', async () => {
    repo.countOwnLabels.mockResolvedValue(0);
    await expect(create.execute({ label_ids: [99] }, actor)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('create: a body over 200 KB is 400', async () => {
    await expect(
      create.execute({ content: doc('x'.repeat(210 * 1024)) }, actor),
    ).rejects.toThrow(BadRequestException);
  });

  it('update: a note in the trash is read-only', async () => {
    repo.findOwn.mockResolvedValue(note({ deletedAt: new Date() }));
    await expect(update.execute(3, { color: 'red' }, actor)).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('update: color only keeps the text; body change rebuilds it', async () => {
    repo.findOwn.mockResolvedValue(note());
    repo.update.mockResolvedValue(note());
    await update.execute(3, { color: 'red' }, actor);
    expect(callArg(repo.update, 0, 2)).not.toHaveProperty('contentText');
    expect(callArg(repo.update, 0, 3)).toBeUndefined();

    await update.execute(3, { content: doc('Nouveau') }, actor);
    expect(callArg(repo.update, 1, 2)).toMatchObject({
      title: 'Achats',
      contentText: 'Achats\nNouveau',
    });
  });

  it('update: an empty title is no title, the body stays', async () => {
    repo.findOwn.mockResolvedValue(note());
    repo.update.mockResolvedValue(note());
    await update.execute(3, { title: '' }, actor);
    expect(callArg(repo.update, 0, 2)).toMatchObject({ title: null });
    expect(callArg<{ content: unknown }>(repo.update, 0, 2).content).toEqual(
      doc('Vis 4x40'),
    );
  });

  it('trash then restore; twice changes nothing', async () => {
    repo.findOwn.mockResolvedValue(note());
    repo.setDeletedAt.mockResolvedValue(note({ deletedAt: new Date() }));
    await trash.trash(3, actor);
    expect(repo.setDeletedAt).toHaveBeenCalledWith(3, expect.any(Date));

    repo.findOwn.mockResolvedValue(note({ deletedAt: new Date() }));
    await trash.trash(3, actor);
    expect(repo.setDeletedAt).toHaveBeenCalledTimes(1);

    repo.setDeletedAt.mockResolvedValue(note());
    await trash.restore(3, actor);
    expect(repo.setDeletedAt).toHaveBeenLastCalledWith(3, null);
  });

  it('delete for good: only from the trash, images first', async () => {
    repo.findOwn.mockResolvedValue(note());
    await expect(remove.deleteOne(3, actor)).rejects.toThrow(
      BadRequestException,
    );

    repo.findOwn.mockResolvedValue(note({ deletedAt: new Date() }));
    const order: string[] = [];
    media.deleteAllForEntity.mockImplementation(() => order.push('media'));
    repo.hardDelete.mockImplementation(() => order.push('note'));
    await expect(remove.deleteOne(3, actor)).resolves.toEqual({ deleted: [3] });
    expect(media.deleteAllForEntity).toHaveBeenCalledWith('note', 3, actor);
    expect(order).toEqual(['media', 'note']);
  });

  it('empty trash deletes every trashed note of the caller', async () => {
    repo.findTrashedIds.mockResolvedValue([3, 4]);
    await expect(remove.emptyTrash(actor)).resolves.toEqual({
      deleted: [3, 4],
    });
    expect(repo.findTrashedIds).toHaveBeenCalledWith(7);
    expect(repo.hardDelete).toHaveBeenCalledTimes(2);
  });

  it('purge: notes trashed more than 7 days ago, owner as actor', async () => {
    const now = new Date('2026-10-17T12:00:00Z');
    repo.findTrashedBefore.mockResolvedValue([{ id: 5, userId: 8 }]);
    await expect(remove.purgeExpired(1, now)).resolves.toBe(1);
    expect(repo.findTrashedBefore).toHaveBeenCalledWith(trashCutoff(now));
    expect(media.deleteAllForEntity).toHaveBeenCalledWith(
      'note',
      5,
      expect.objectContaining({ tenantId: 1, userId: 8 }),
    );
    expect(repo.hardDelete).toHaveBeenCalledWith(5);
  });

  it('images: upload as a note file; unknown image is 404', async () => {
    repo.findOwn.mockResolvedValue(note());
    media.upload.mockResolvedValue({ id: 9, fileUrl: 'u', fileName: 'a.png' });
    const file = { originalname: 'a.png' } as Express.Multer.File;
    await expect(images.add(3, file, actor)).resolves.toEqual({
      id: 9,
      fileUrl: 'u',
      fileName: 'a.png',
    });
    expect(media.upload).toHaveBeenCalledWith(
      file,
      { entity_type: 'note', entity_id: 3 },
      actor,
    );

    media.deleteForEntity.mockResolvedValue({ deleted: [], skipped: [] });
    await expect(images.remove(3, 99, actor)).rejects.toThrow(
      NotFoundException,
    );
    expect(media.deleteForEntity).toHaveBeenCalledWith('note', 3, [99], actor);
  });

  it('labels: a used name is 409; someone else label is 404', async () => {
    repo.createLabel.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );
    await expect(labels.create({ name: 'Chantier' }, actor)).rejects.toThrow(
      ConflictException,
    );

    repo.findOwnLabel.mockResolvedValue(null);
    await expect(labels.remove(2, actor)).rejects.toThrow(NotFoundException);
    expect(repo.findOwnLabel).toHaveBeenCalledWith(2, 7);
    expect(repo.deleteLabel).not.toHaveBeenCalled();
  });
});
