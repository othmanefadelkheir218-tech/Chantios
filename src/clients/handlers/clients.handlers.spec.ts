import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { ClientRepository } from '../repositories/client.repository';
import { ArchiveClientHandler } from './archive-client.handler';
import { CreateClientHandler } from './create-client.handler';
import { FindClientHandler } from './find-client.handler';
import { FindClientsHandler } from './find-clients.handler';
import { UpdateClientHandler } from './update-client.handler';

const actor = { userId: 1, tenantId: 1, roleId: 1, email: 'admin@test.local' };

const client = (over: Record<string, unknown> = {}) => ({
  id: 2,
  tenantId: 1,
  type: 'individual',
  name: 'Dubois',
  contactName: null,
  email: 'dubois@test.local',
  phone: '+32470000000',
  phoneSecondary: null,
  vatNumber: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  country: null,
  note: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('Clients handlers', () => {
  const repo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    setActive: jest.fn(),
    countActive: jest.fn(),
  };
  const audit = { write: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let createClient: CreateClientHandler;
  let findClients: FindClientsHandler;
  let findClient: FindClientHandler;
  let updateClient: UpdateClientHandler;
  let archiveClient: ArchiveClientHandler;

  beforeEach(async () => {
    jest.resetAllMocks();
    const handlers = [
      CreateClientHandler,
      FindClientsHandler,
      FindClientHandler,
      UpdateClientHandler,
      ArchiveClientHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: ClientRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();

    createClient = module.get(CreateClientHandler);
    findClients = module.get(FindClientsHandler);
    findClient = module.get(FindClientHandler);
    updateClient = module.get(UpdateClientHandler);
    archiveClient = module.get(ArchiveClientHandler);
  });

  describe('CreateClientHandler', () => {
    it('rejects a professional client with no vat_number', async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(
        createClient.execute(
          {
            type: 'professional',
            name: 'Acme',
            email: 'acme@test.local',
            phone: '+32470000001',
          } as never,
          actor,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate email within the tenant', async () => {
      repo.findByEmail.mockResolvedValue(client());

      await expect(
        createClient.execute(
          {
            name: 'Dubois',
            email: 'dubois@test.local',
            phone: '+32470000000',
          },
          actor,
        ),
      ).rejects.toThrow(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a client and writes one audit entry', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(client());

      const result = await createClient.execute(
        {
          name: 'Dubois',
          email: 'dubois@test.local',
          phone: '+32470000000',
        },
        actor,
      );

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1, type: 'individual' }),
      );
      expect(result.email).toBe('dubois@test.local');
      expect(audit.write).toHaveBeenCalledTimes(1);
      expect(audit.write).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entityType: 'client' }),
      );
    });

    it('accepts a professional client with a vat_number', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(
        client({ type: 'professional', vatNumber: 'BE0123456789' }),
      );

      const result = await createClient.execute(
        {
          type: 'professional',
          name: 'Acme',
          email: 'acme@test.local',
          phone: '+32470000001',
          vat_number: 'BE0123456789',
        } as never,
        actor,
      );
      expect(result.vatNumber).toBe('BE0123456789');
    });
  });

  describe('FindClientsHandler', () => {
    it('returns a paginated list', async () => {
      repo.findMany.mockResolvedValue([[client()], 1]);

      const result = await findClients.execute({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('FindClientHandler', () => {
    it('rejects an unknown client', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(findClient.execute(99)).rejects.toThrow(NotFoundException);
    });

    it('returns the client', async () => {
      repo.findById.mockResolvedValue(client());
      const result = await findClient.execute(2);
      expect(result.id).toBe(2);
    });
  });

  describe('UpdateClientHandler', () => {
    it('rejects an unknown client', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(updateClient.execute(99, {}, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects switching to professional with no vat_number', async () => {
      repo.findById.mockResolvedValue(client());
      await expect(
        updateClient.execute(2, { type: 'professional' } as never, actor),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('allows switching to professional when vat_number is given together', async () => {
      repo.findById.mockResolvedValue(client());
      repo.update.mockResolvedValue(
        client({ type: 'professional', vatNumber: 'BE0123456789' }),
      );

      const result = await updateClient.execute(
        2,
        { type: 'professional', vat_number: 'BE0123456789' } as never,
        actor,
      );
      expect(result.type).toBe('professional');
      expect(audit.write).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate email within the tenant', async () => {
      repo.findById.mockResolvedValue(client());
      repo.findByEmail.mockResolvedValue(
        client({ id: 5, email: 'other@test.local' }),
      );

      await expect(
        updateClient.execute(2, { email: 'other@test.local' }, actor),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('ArchiveClientHandler', () => {
    it('rejects an unknown client', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(archiveClient.execute(99, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('sets is_active false and keeps the row', async () => {
      repo.findById.mockResolvedValue(client());
      repo.setActive.mockResolvedValue(client({ isActive: false }));

      const result = await archiveClient.execute(2, actor);

      expect(repo.setActive).toHaveBeenCalledWith(2, false);
      expect(result.isActive).toBe(false);
      expect(audit.write).toHaveBeenCalledTimes(1);
    });
  });
});
