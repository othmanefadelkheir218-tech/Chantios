import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ClientsService } from '../../clients/clients.service';
import { MediaService } from '../../media/media.service';
import { RolesService } from '../../roles/roles.service';
import { StockService } from '../../stock/stock.service';
import { ProjectStatusHistoryRepository } from '../repositories/project-status-history.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { CancelProjectHandler } from './cancel-project.handler';
import { ChangeStatusHandler } from './change-status.handler';
import { CreateProjectHandler } from './create-project.handler';
import { DeleteProjectHandler } from './delete-project.handler';
import { FindProjectHandler } from './find-project.handler';
import { FindProjectsHandler } from './find-projects.handler';
import { UpdateProjectHandler } from './update-project.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const project = (over: Record<string, unknown> = {}) => ({
  id: 10,
  tenantId: 1,
  clientId: 2,
  name: 'Bathroom renovation',
  description: null,
  status: 'prospect',
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  startDate: null,
  endDate: null,
  actualEndDate: null,
  managerId: null,
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const client = (over: Record<string, unknown> = {}) => ({
  id: 2,
  tenantId: 1,
  isActive: true,
  ...over,
});

describe('Projects handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
    countByClient: jest.fn(),
    delete: jest.fn(),
  };
  const history = {
    write: jest.fn(),
    findByProject: jest.fn(),
  };
  const clients = { findByIdRaw: jest.fn(), countActive: jest.fn() };
  const roles = { findRoleById: jest.fn() };
  const media = { deleteAllForEntity: jest.fn() };
  const stock = { releaseByProject: jest.fn() };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let createProject: CreateProjectHandler;
  let findProjects: FindProjectsHandler;
  let findProject: FindProjectHandler;
  let updateProject: UpdateProjectHandler;
  let changeStatus: ChangeStatusHandler;
  let cancelProject: CancelProjectHandler;
  let deleteProject: DeleteProjectHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateProjectHandler,
      FindProjectsHandler,
      FindProjectHandler,
      UpdateProjectHandler,
      ChangeStatusHandler,
      CancelProjectHandler,
      DeleteProjectHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: ProjectRepository, useValue: repo },
        { provide: ProjectStatusHistoryRepository, useValue: history },
        { provide: ClientsService, useValue: clients },
        { provide: RolesService, useValue: roles },
        { provide: MediaService, useValue: media },
        { provide: StockService, useValue: stock },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createProject = module.get(CreateProjectHandler);
    findProjects = module.get(FindProjectsHandler);
    findProject = module.get(FindProjectHandler);
    updateProject = module.get(UpdateProjectHandler);
    changeStatus = module.get(ChangeStatusHandler);
    cancelProject = module.get(CancelProjectHandler);
    deleteProject = module.get(DeleteProjectHandler);
  });

  describe('CreateProjectHandler', () => {
    it('rejects an unknown client', async () => {
      clients.findByIdRaw.mockResolvedValue(null);
      await expect(
        createProject.execute({ client_id: 99, name: 'X' }, actor),
      ).rejects.toThrow(NotFoundException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects an archived client', async () => {
      clients.findByIdRaw.mockResolvedValue(client({ isActive: false }));
      await expect(
        createProject.execute({ client_id: 2, name: 'X' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects end_date before start_date', async () => {
      clients.findByIdRaw.mockResolvedValue(client());
      await expect(
        createProject.execute(
          {
            client_id: 2,
            name: 'X',
            start_date: '2026-02-10',
            end_date: '2026-01-01',
          },
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a project at prospect and writes the first history row', async () => {
      clients.findByIdRaw.mockResolvedValue(client());
      repo.create.mockResolvedValue(project());

      const result = await createProject.execute(
        { client_id: 2, name: 'Bathroom renovation' },
        actor,
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'prospect',
          createdBy: actor.userId,
        }),
      );
      expect(history.write).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 10,
          fromStatus: null,
          toStatus: 'prospect',
        }),
      );
      expect(result.status).toBe('prospect');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('FindProjectsHandler', () => {
    it('returns a paginated list', async () => {
      repo.findMany.mockResolvedValue([[project()], 1]);
      const result = await findProjects.execute({
        page: 1,
        limit: 20,
      });
      expect(result.total).toBe(1);
    });
  });

  describe('FindProjectHandler', () => {
    it('rejects an unknown project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findProject.execute(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the project history', async () => {
      repo.findById.mockResolvedValue(project());
      history.findByProject.mockResolvedValue([
        {
          id: 1,
          tenantId: 1,
          projectId: 10,
          fromStatus: null,
          toStatus: 'prospect',
          reason: null,
          changedBy: 1,
          changedAt: new Date(),
        },
      ]);
      const result = await findProject.history(10);
      expect(result).toHaveLength(1);
    });

    it('rejects history for an unknown project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findProject.history(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('UpdateProjectHandler', () => {
    it('rejects an unknown project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(updateProject.execute(99, {}, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects end_date before the existing start_date', async () => {
      repo.findById.mockResolvedValue(
        project({ startDate: new Date('2026-02-10') }),
      );
      await expect(
        updateProject.execute(10, { end_date: '2026-01-01' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates the project', async () => {
      repo.findById.mockResolvedValue(project());
      repo.update.mockResolvedValue(project({ name: 'New name' }));
      const result = await updateProject.execute(
        10,
        { name: 'New name' },
        actor,
      );
      expect(result.name).toBe('New name');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });

  describe('ChangeStatusHandler', () => {
    it('rejects an unknown project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        changeStatus.execute(99, { status: 'in_progress' } as never, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a move not in the matrix (prospect -> completed)', async () => {
      repo.findById.mockResolvedValue(project({ status: 'prospect' }));
      await expect(
        changeStatus.execute(10, { status: 'completed' } as never, actor),
      ).rejects.toThrow(BadRequestException);
      expect(repo.setStatus).not.toHaveBeenCalled();
    });

    it('rejects any move out of cancelled', async () => {
      repo.findById.mockResolvedValue(project({ status: 'cancelled' }));
      await expect(
        changeStatus.execute(10, { status: 'in_progress' } as never, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows prospect -> in_progress and writes history', async () => {
      repo.findById.mockResolvedValue(project({ status: 'prospect' }));
      repo.setStatus.mockResolvedValue(project({ status: 'in_progress' }));

      const result = await changeStatus.execute(
        10,
        { status: 'in_progress' } as never,
        actor,
      );

      expect(repo.setStatus).toHaveBeenCalledWith(10, 'in_progress', undefined);
      expect(history.write).toHaveBeenCalledWith(
        expect.objectContaining({
          fromStatus: 'prospect',
          toStatus: 'in_progress',
        }),
      );
      expect(result.status).toBe('in_progress');
    });

    it('sets actual_end_date when moving to completed, no payment check', async () => {
      repo.findById.mockResolvedValue(project({ status: 'in_progress' }));
      repo.setStatus.mockResolvedValue(
        project({ status: 'completed', actualEndDate: new Date() }),
      );

      const result = await changeStatus.execute(
        10,
        { status: 'completed' } as never,
        actor,
      );

      expect(repo.setStatus).toHaveBeenCalledWith(
        10,
        'completed',
        expect.any(Date),
      );
      expect(result.status).toBe('completed');
    });

    it('rejects completed -> in_progress for a non-admin', async () => {
      repo.findById.mockResolvedValue(project({ status: 'completed' }));
      roles.findRoleById.mockResolvedValue({ id: 2, name: 'manager' });

      await expect(
        changeStatus.execute(10, { status: 'in_progress' } as never, actor),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.setStatus).not.toHaveBeenCalled();
    });

    it('allows completed -> in_progress for an admin', async () => {
      repo.findById.mockResolvedValue(project({ status: 'completed' }));
      roles.findRoleById.mockResolvedValue({ id: 1, name: 'admin' });
      repo.setStatus.mockResolvedValue(project({ status: 'in_progress' }));

      const result = await changeStatus.execute(
        10,
        { status: 'in_progress' } as never,
        actor,
      );
      expect(result.status).toBe('in_progress');
    });

    it('delegates cancellation to CancelProjectHandler', async () => {
      repo.findById.mockResolvedValue(project({ status: 'prospect' }));
      repo.setStatus.mockResolvedValue(project({ status: 'cancelled' }));

      const result = await changeStatus.execute(
        10,
        { status: 'cancelled', reason: 'client withdrew' } as never,
        actor,
      );

      expect(repo.setStatus).toHaveBeenCalledWith(10, 'cancelled');
      expect(history.write).toHaveBeenCalledWith(
        expect.objectContaining({
          toStatus: 'cancelled',
          reason: 'client withdrew',
        }),
      );
      expect(result.status).toBe('cancelled');
    });
  });

  describe('CancelProjectHandler', () => {
    it('cancels and writes one audit entry', async () => {
      repo.setStatus.mockResolvedValue(project({ status: 'cancelled' }));
      const result = await cancelProject.execute(
        project({ status: 'in_progress' }) as never,
        'done',
        actor,
      );
      expect(result.status).toBe('cancelled');
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'cancel', entityType: 'project' }),
      );
    });
  });

  describe('DeleteProjectHandler', () => {
    it('rejects an unknown project', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(deleteProject.execute(99, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses to delete a non-prospect project', async () => {
      repo.findById.mockResolvedValue(project({ status: 'in_progress' }));
      await expect(deleteProject.execute(10, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(media.deleteAllForEntity).not.toHaveBeenCalled();
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('cascades to media then deletes a prospect project', async () => {
      repo.findById.mockResolvedValue(project({ status: 'prospect' }));
      media.deleteAllForEntity.mockResolvedValue({ deleted: [], skipped: [] });
      repo.delete.mockResolvedValue(project({ status: 'prospect' }));

      const result = await deleteProject.execute(10, actor);

      expect(media.deleteAllForEntity).toHaveBeenCalledWith(
        'project',
        10,
        actor,
      );
      expect(repo.delete).toHaveBeenCalledWith(10);
      expect(result).toEqual({ id: 10, deleted: true });
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });
});
