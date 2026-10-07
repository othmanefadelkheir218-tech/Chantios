import { containing } from '../../common/testing/spec-helpers';
import { NotificationsService } from '../../notifications/notifications.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ProjectsService } from '../../projects/projects.service';
import { UsersService } from '../../users/users.service';
import { buildTaskFilter } from '../helpers/task.helper';
import { TaskRepository } from '../repositories/task.repository';
import { CreateTaskHandler } from './create-task.handler';
import { FindTasksHandler } from './find-tasks.handler';
import { SetAssigneesHandler } from './set-assignees.handler';
import { SetTaskStatusHandler } from './set-task-status.handler';
import { UpdateTaskHandler } from './update-task.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };
const FIXED = new Date('2026-10-06T00:00:00Z');

const task = (over: Record<string, unknown> = {}) => ({
  id: 5,
  tenantId: 1,
  projectId: 12,
  title: 'Demolition',
  type: 'work',
  startDate: new Date('2026-11-02'),
  endDate: new Date('2026-11-06'),
  status: 'planned',
  createdBy: 1,
  createdAt: FIXED,
  updatedAt: FIXED,
  assignees: [] as { userId: number }[],
  ...over,
});

const body = (over: Record<string, unknown> = {}) => ({
  project_id: 12,
  title: 'Demolition',
  type: 'work' as const,
  start_date: '2026-11-02',
  end_date: '2026-11-06',
  ...over,
});

describe('Tasks handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
    replaceAssignees: jest.fn(),
  };
  const tx = {};
  const tenantPrisma = {
    db: { $transaction: jest.fn((fn: (t: unknown) => unknown) => fn(tx)) },
  };
  const projects = { findOne: jest.fn() };
  const users = { findActiveInTenant: jest.fn() };
  const audit = { write: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateTaskHandler;
  let find: FindTasksHandler;
  let update: UpdateTaskHandler;
  let setStatus: SetTaskStatusHandler;
  let setAssignees: SetAssigneesHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    tenantPrisma.db.$transaction.mockImplementation((fn) => fn(tx));
    const handlers = [
      CreateTaskHandler,
      FindTasksHandler,
      UpdateTaskHandler,
      SetTaskStatusHandler,
      SetAssigneesHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        { provide: NotificationsService, useValue: notifications },
        ...handlers,
        { provide: TaskRepository, useValue: repo },
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: ProjectsService, useValue: projects },
        { provide: UsersService, useValue: users },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateTaskHandler);
    find = module.get(FindTasksHandler);
    update = module.get(UpdateTaskHandler);
    setStatus = module.get(SetTaskStatusHandler);
    setAssignees = module.get(SetAssigneesHandler);
  });

  describe('CreateTaskHandler', () => {
    it('creates one task with its assignees, status planned', async () => {
      projects.findOne.mockResolvedValue({ id: 12, status: 'in_progress' });
      users.findActiveInTenant.mockResolvedValue({ id: 3 });
      repo.create.mockResolvedValue(
        task({ assignees: [{ userId: 3 }, { userId: 4 }] }),
      );

      const result = await create.execute(
        body({ assignee_ids: [3, 4] }),
        actor,
        'all',
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 12, status: 'planned' }),
        [3, 4],
        tx,
      );
      expect(result.assigneeIds).toEqual([3, 4]);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('refuses the same user twice', async () => {
      projects.findOne.mockResolvedValue({ id: 12, status: 'in_progress' });
      users.findActiveInTenant.mockResolvedValue({ id: 3 });
      await expect(
        create.execute(body({ assignee_ids: [3, 3] }), actor, 'all'),
      ).rejects.toThrow(/only be assigned once/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('refuses an assignee who is not an active user of this tenant', async () => {
      projects.findOne.mockResolvedValue({ id: 12, status: 'in_progress' });
      users.findActiveInTenant.mockResolvedValue(null);
      await expect(
        create.execute(body({ assignee_ids: [99] }), actor, 'all'),
      ).rejects.toThrow(/not an active user/);
    });

    it('refuses end before start', async () => {
      await expect(
        create.execute(
          body({ start_date: '2026-11-10', end_date: '2026-11-01' }),
          actor,
          'all',
        ),
      ).rejects.toThrow(/end_date cannot be before start_date/);
    });

    it('refuses a cancelled project', async () => {
      projects.findOne.mockResolvedValue({ id: 12, status: 'cancelled' });
      await expect(create.execute(body(), actor, 'all')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('a worker (scope own) can never create a task', async () => {
      await expect(create.execute(body(), actor, 'own')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('SetTaskStatusHandler', () => {
    it('refuses to leave planned with no assignee', async () => {
      repo.findById.mockResolvedValue(task());
      await expect(
        setStatus.execute(5, { status: 'in_progress' }, actor, 'all'),
      ).rejects.toThrow(/at least one assignee/);
      expect(repo.setStatus).not.toHaveBeenCalled();
    });

    it('allows leaving planned with an assignee', async () => {
      repo.findById
        .mockResolvedValueOnce(task({ assignees: [{ userId: 3 }] }))
        .mockResolvedValueOnce(
          task({ status: 'in_progress', assignees: [{ userId: 3 }] }),
        );
      projects.findOne.mockResolvedValue({ name: 'Site' });
      const result = await setStatus.execute(
        5,
        { status: 'in_progress' },
        actor,
        'all',
      );
      expect(repo.setStatus).toHaveBeenCalledWith(5, 'in_progress');
      expect(result.status).toBe('in_progress');
      // the assignees hear about it — never the person who made the change
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'task_status_changed',
        expect.objectContaining({
          tenantId: 1,
          userIds: [3],
          excludeUserIds: [actor.userId],
          payload: containing({
            entity_id: 5,
            status: 'in_progress',
            project_name: 'Site',
          }),
        }),
      );
    });
  });

  describe('SetAssigneesHandler', () => {
    it('replaces the set in one transaction', async () => {
      repo.findById
        .mockResolvedValueOnce(task({ assignees: [{ userId: 3 }] }))
        .mockResolvedValueOnce(task({ assignees: [{ userId: 7 }] }));
      users.findActiveInTenant.mockResolvedValue({ id: 7 });
      projects.findOne.mockResolvedValue({ name: 'Site' });
      const result = await setAssignees.execute(
        5,
        { user_ids: [7] },
        actor,
        'all',
      );
      expect(repo.replaceAssignees).toHaveBeenCalledWith(5, 1, [7], tx);
      expect(result.assigneeIds).toEqual([7]);
    });

    it('only the NEWLY added assignees are told (user 3 stays, user 7 is new)', async () => {
      repo.findById
        .mockResolvedValueOnce(task({ assignees: [{ userId: 3 }] }))
        .mockResolvedValueOnce(
          task({ assignees: [{ userId: 3 }, { userId: 7 }] }),
        );
      users.findActiveInTenant.mockResolvedValue({ id: 7 });
      projects.findOne.mockResolvedValue({ name: 'Site' });
      await setAssignees.execute(5, { user_ids: [3, 7] }, actor, 'all');
      expect(notifications.dispatch).toHaveBeenCalledTimes(1);
      expect(notifications.dispatch).toHaveBeenCalledWith(
        'task_assigned',
        expect.objectContaining({ userIds: [7] }),
      );
    });

    it('nobody new -> no alert', async () => {
      repo.findById
        .mockResolvedValueOnce(task({ assignees: [{ userId: 3 }] }))
        .mockResolvedValueOnce(task({ assignees: [{ userId: 3 }] }));
      users.findActiveInTenant.mockResolvedValue({ id: 3 });
      await setAssignees.execute(5, { user_ids: [3] }, actor, 'all');
      expect(notifications.dispatch).not.toHaveBeenCalled();
    });

    it('refuses duplicates', async () => {
      repo.findById.mockResolvedValue(task());
      await expect(
        setAssignees.execute(5, { user_ids: [7, 7] }, actor, 'all'),
      ).rejects.toThrow(/only be assigned once/);
      expect(repo.replaceAssignees).not.toHaveBeenCalled();
    });
  });

  describe('UpdateTaskHandler', () => {
    it('checks the end date against the stored start date', async () => {
      repo.findById.mockResolvedValue(task());
      await expect(
        update.execute(5, { end_date: '2026-10-01' }, actor, 'all'),
      ).rejects.toThrow(/end_date cannot be before start_date/);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('FindTasksHandler — scope own', () => {
    it('lists only the tasks of the caller', async () => {
      repo.findMany.mockResolvedValue([[task()], 1]);
      await find.execute({ page: 1, limit: 20 }, actor, 'own');
      expect(repo.findMany).toHaveBeenCalledWith(
        { assignees: { some: { userId: 1 } } },
        0,
        20,
      );
    });

    it('a task that is not theirs is a 404', async () => {
      repo.findById.mockResolvedValue(task({ assignees: [{ userId: 9 }] }));
      await expect(find.findOne(5, actor, 'own')).rejects.toThrow(/not found/i);
    });
  });

  describe('buildTaskFilter', () => {
    it('from/to select tasks whose range overlaps the window', () => {
      expect(buildTaskFilter({ from: '2026-11-01', to: '2026-11-30' })).toEqual(
        {
          endDate: { gte: new Date('2026-11-01') },
          startDate: { lte: new Date('2026-11-30') },
        },
      );
    });
  });
});
