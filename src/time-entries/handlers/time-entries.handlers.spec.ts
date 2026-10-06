import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ProjectsService } from '../../projects/projects.service';
import { TasksService } from '../../tasks/tasks.service';
import { UsersService } from '../../users/users.service';
import { checkDailyTotal } from '../helpers/daily-hours.helper';
import { TimeEntryRepository } from '../repositories/time-entry.repository';
import { CreateTimeEntryHandler } from './create-time-entry.handler';
import { DeleteTimeEntryHandler } from './delete-time-entry.handler';
import { FindTimeEntriesHandler } from './find-time-entries.handler';
import { UpdateTimeEntryHandler } from './update-time-entry.handler';

const manager = { userId: 1, tenantId: 1, roleId: 2, email: 'm@test.local' };
const worker = { userId: 7, tenantId: 1, roleId: 5, email: 'w@test.local' };
const NOW = new Date();

const entry = (over: Record<string, unknown> = {}) => ({
  id: 20,
  tenantId: 1,
  projectId: 12,
  userId: 7,
  taskId: null,
  workDate: new Date('2026-11-03'),
  hours: new Prisma.Decimal('8'),
  hourlyRate: new Prisma.Decimal('30'),
  comment: null,
  createdBy: 7,
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

const body = (over: Record<string, unknown> = {}) => ({
  project_id: 12,
  work_date: '2026-11-03',
  hours: '8',
  ...over,
});

describe('daily-hours.helper — the day rule', () => {
  const d = (n: string) => new Prisma.Decimal(n);

  it('up to 12h: saved, no alert', () => {
    expect(checkDailyTotal(d('4'), d('8'), '2026-11-03')).toMatchObject({
      abnormal: false,
    });
  });

  it('5h on A + 3h on B = 8h', () => {
    expect(checkDailyTotal(d('5'), d('3'), '2026-11-03').total.toString()).toBe(
      '8',
    );
  });

  it('over 12h: saved + abnormal', () => {
    expect(checkDailyTotal(d('7'), d('6'), '2026-11-03')).toMatchObject({
      abnormal: true,
    });
  });

  it('exactly 12h is not abnormal, exactly 24h is allowed', () => {
    expect(checkDailyTotal(d('4'), d('8'), 'x').abnormal).toBe(false);
    expect(() => checkDailyTotal(d('12'), d('12'), 'x')).not.toThrow();
  });

  it('over 24h across projects: rejected (20h + 20h)', () => {
    expect(() => checkDailyTotal(d('20'), d('20'), '2026-11-03')).toThrow(
      BadRequestException,
    );
  });
});

describe('Time entries handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    sumHoursForUserOnDate: jest.fn(),
    findByUserProjectDate: jest.fn(),
  };
  const projects = { findOne: jest.fn() };
  const tasks = { isAssignedToProject: jest.fn(), findByIdRaw: jest.fn() };
  const users = { findActiveInTenant: jest.fn() };
  const audit = { write: jest.fn(), wasTouchedByOthers: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let create: CreateTimeEntryHandler;
  let update: UpdateTimeEntryHandler;
  let remove: DeleteTimeEntryHandler;
  let find: FindTimeEntriesHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateTimeEntryHandler,
      UpdateTimeEntryHandler,
      DeleteTimeEntryHandler,
      FindTimeEntriesHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: TimeEntryRepository, useValue: repo },
        { provide: ProjectsService, useValue: projects },
        { provide: TasksService, useValue: tasks },
        { provide: UsersService, useValue: users },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    create = module.get(CreateTimeEntryHandler);
    update = module.get(UpdateTimeEntryHandler);
    remove = module.get(DeleteTimeEntryHandler);
    find = module.get(FindTimeEntriesHandler);

    projects.findOne.mockResolvedValue({ id: 12 });
    users.findActiveInTenant.mockResolvedValue({
      id: 7,
      hourlyRate: new Prisma.Decimal('30'),
    });
    repo.findByUserProjectDate.mockResolvedValue(null);
    repo.sumHoursForUserOnDate.mockResolvedValue(new Prisma.Decimal(0));
    tasks.isAssignedToProject.mockResolvedValue(true);
    audit.wasTouchedByOthers.mockResolvedValue(false);
  });

  describe('CreateTimeEntryHandler', () => {
    it('saves 8h and freezes the hourly rate from the user', async () => {
      repo.create.mockResolvedValue(entry());
      const result = await create.execute(body(), worker, 'own');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          hours: '8',
          hourlyRate: new Prisma.Decimal('30'),
          createdBy: 7,
        }),
      );
      expect(result.dailyTotalHours).toBe('8.00');
      expect(result.abnormalHours).toBe(false);
    });

    it('13h in a day is saved AND flagged abnormal', async () => {
      repo.sumHoursForUserOnDate.mockResolvedValue(new Prisma.Decimal(7));
      repo.create.mockResolvedValue(entry({ hours: new Prisma.Decimal('6') }));
      const result = await create.execute(body({ hours: '6' }), worker, 'own');
      expect(result.abnormalHours).toBe(true);
      expect(result.dailyTotalHours).toBe('13.00');
    });

    it('20h + 20h on two projects: the second is rejected', async () => {
      repo.sumHoursForUserOnDate.mockResolvedValue(new Prisma.Decimal(20));
      await expect(
        create.execute(body({ hours: '20' }), worker, 'own'),
      ).rejects.toThrow(/maximum is 24h/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects 0h, negative and more than 24h on one row', async () => {
      for (const hours of ['0', '-1', '24.5']) {
        await expect(
          create.execute(body({ hours }), worker, 'own'),
        ).rejects.toThrow(/hours must be/);
      }
    });

    it('a worker on a project where they have no task is refused', async () => {
      tasks.isAssignedToProject.mockResolvedValue(false);
      await expect(create.execute(body(), worker, 'own')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('task_id stays optional: no task_id still passes the project-level check', async () => {
      repo.create.mockResolvedValue(entry());
      await create.execute(body(), worker, 'own');
      expect(tasks.findByIdRaw).not.toHaveBeenCalled();
      expect(tasks.isAssignedToProject).toHaveBeenCalledWith(7, 12);
    });

    it('a task_id from another project is refused', async () => {
      tasks.findByIdRaw.mockResolvedValue({ id: 3, projectId: 99 });
      await expect(
        create.execute(body({ task_id: 3 }), worker, 'own'),
      ).rejects.toThrow(/does not belong to this project/);
    });

    it('a worker cannot log for someone else', async () => {
      await expect(
        create.execute(body({ user_id: 8 }), worker, 'own'),
      ).rejects.toThrow(/only log your own hours/);
    });

    it('a manager can log for a worker, with no assignment check', async () => {
      repo.create.mockResolvedValue(entry({ createdBy: 1 }));
      await create.execute(body({ user_id: 7 }), manager, 'all');
      expect(tasks.isAssignedToProject).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 7, createdBy: 1 }),
      );
    });

    it('a second entry for the same user, project and day updates the row', async () => {
      repo.findByUserProjectDate.mockResolvedValue(entry());
      repo.findById.mockResolvedValue(entry());
      repo.update.mockResolvedValue(entry({ hours: new Prisma.Decimal('6') }));

      await create.execute(body({ hours: '6' }), worker, 'own');

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        20,
        expect.objectContaining({ hours: '6' }),
      );
    });
  });

  describe('UpdateTimeEntryHandler — the correction rules', () => {
    it('the edited row is excluded from the daily sum', async () => {
      repo.findById.mockResolvedValue(entry());
      repo.sumHoursForUserOnDate.mockResolvedValue(new Prisma.Decimal(10));
      await expect(
        update.execute(20, { hours: '20' }, worker, 'own'),
      ).rejects.toThrow(/maximum is 24h/);
      expect(repo.sumHoursForUserOnDate).toHaveBeenCalledWith(
        7,
        expect.any(Date),
        20,
      );
    });

    it('a worker edits their own entry the same day', async () => {
      repo.findById.mockResolvedValue(entry());
      repo.update.mockResolvedValue(entry({ hours: new Prisma.Decimal('6') }));
      const result = await update.execute(20, { hours: '6' }, worker, 'own');
      expect(result.hours.toString()).toBe('6');
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          entityType: 'time_entry',
          oldValue: expect.objectContaining({ userId: 7 }) as unknown,
        }),
      );
    });

    it('the next day it is read-only to the worker', async () => {
      const yesterday = new Date(Date.now() - 36 * 3600 * 1000);
      repo.findById.mockResolvedValue(entry({ createdAt: yesterday }));
      await expect(
        update.execute(20, { hours: '6' }, worker, 'own'),
      ).rejects.toThrow(/read-only/);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('if someone else touched it, it is read-only to the worker', async () => {
      repo.findById.mockResolvedValue(entry());
      audit.wasTouchedByOthers.mockResolvedValue(true);
      await expect(
        update.execute(20, { hours: '6' }, worker, 'own'),
      ).rejects.toThrow(/changed by someone else/);
    });

    it("a worker never sees another worker's entry (404)", async () => {
      repo.findById.mockResolvedValue(entry({ userId: 8 }));
      await expect(
        update.execute(20, { hours: '6' }, worker, 'own'),
      ).rejects.toThrow(NotFoundException);
    });

    it('a manager edits a week-old entry, the rate stays frozen', async () => {
      const weekOld = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      repo.findById.mockResolvedValue(entry({ createdAt: weekOld }));
      repo.update.mockResolvedValue(entry({ hours: new Prisma.Decimal('5') }));

      await update.execute(20, { hours: '5' }, manager, 'all');

      expect(repo.update).toHaveBeenCalledWith(20, { hours: '5' });
      expect(audit.wasTouchedByOthers).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalledWith(
        20,
        expect.objectContaining({ hourlyRate: expect.anything() as unknown }),
      );
    });
  });

  describe('DeleteTimeEntryHandler', () => {
    it('a worker can never delete', async () => {
      await expect(remove.execute(20, worker, 'own')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('a manager deletes, the old value goes to audit_logs', async () => {
      repo.findById.mockResolvedValue(entry());
      await remove.execute(20, manager, 'all');
      expect(repo.delete).toHaveBeenCalledWith(20);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', entityId: 20 }),
      );
    });
  });

  describe('FindTimeEntriesHandler — scope own', () => {
    it('a worker only ever lists their own, ?user_id= is ignored', async () => {
      repo.findMany.mockResolvedValue([[entry()], 1]);
      await find.execute({ page: 1, limit: 20, user_id: 99 }, worker, 'own');
      expect(repo.findMany).toHaveBeenCalledWith({ userId: 7 }, 0, 20);
    });

    it('a manager may filter by user', async () => {
      repo.findMany.mockResolvedValue([[], 0]);
      await find.execute({ page: 1, limit: 20, user_id: 99 }, manager, 'all');
      expect(repo.findMany).toHaveBeenCalledWith({ userId: 99 }, 0, 20);
    });

    it('my-entries forces the caller even for a manager', async () => {
      repo.findMany.mockResolvedValue([[], 0]);
      await find.execute(
        { page: 1, limit: 20, user_id: 99 },
        manager,
        'all',
        true,
      );
      expect(repo.findMany).toHaveBeenCalledWith({ userId: 1 }, 0, 20);
    });
  });
});
