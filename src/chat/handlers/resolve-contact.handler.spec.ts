import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { ClientsService } from '../../clients/clients.service';
import { RolesService } from '../../roles/roles.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';
import { ResolveContactHandler } from './resolve-contact.handler';

const roleNames: Record<number, string> = { 2: 'manager', 7: 'accountant' };
const actor = (roleId: number) => ({
  userId: 2,
  roleId,
  tenantId: 1,
  email: null,
});

describe('ResolveContactHandler', () => {
  const access = { assertChat: jest.fn() };
  const clients = { create: jest.fn(), addEmail: jest.fn() };
  const messages = { clearNewAddressFlag: jest.fn() };
  const conversations = { moveContactToClient: jest.fn() };
  const roles = {
    findRoleById: jest.fn((id: number) =>
      Promise.resolve({ id, name: roleNames[id] }),
    ),
    findOverridesForRole: jest.fn(() => Promise.resolve([])),
  };
  let handler: ResolveContactHandler;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ResolveContactHandler,
        { provide: ClientChatAccessHandler, useValue: access },
        { provide: ClientsService, useValue: clients },
        { provide: MessageRepository, useValue: messages },
        { provide: ConversationRepository, useValue: conversations },
        { provide: RolesService, useValue: roles },
        {
          provide: getLoggerToken(ResolveContactHandler.name),
          useValue: { info: jest.fn() },
        },
      ],
    }).compile();
    handler = module.get(ResolveContactHandler);
  });

  const dto = {
    name: 'TEST Eya',
    email: 'eya@x.com',
    phone: '+32 470 00 00 00',
  };

  it('creates the client from the form and moves the contact chat to it', async () => {
    access.assertChat.mockResolvedValue({
      conversation: { id: 10, clientId: null, contactEmail: 'eya@x.com' },
    });
    clients.create.mockResolvedValue({ id: 5, email: 'eya@x.com' });
    await handler.createClient(10, dto, actor(2));
    expect(conversations.moveContactToClient).toHaveBeenCalledWith(10, 5);
    expect(clients.addEmail).not.toHaveBeenCalled();
  });

  it('a changed email keeps the contact address as an extra one', async () => {
    access.assertChat.mockResolvedValue({
      conversation: { id: 10, clientId: null, contactEmail: 'eya@x.com' },
    });
    clients.create.mockResolvedValue({ id: 5, email: 'eya@work.com' });
    await handler.createClient(10, { ...dto, email: 'eya@work.com' }, actor(2));
    expect(clients.addEmail).toHaveBeenCalledWith(5, 'eya@x.com');
  });

  it('a chat that is already a client → 400', async () => {
    access.assertChat.mockResolvedValue({
      conversation: { id: 10, clientId: 3, contactEmail: null },
    });
    await expect(handler.createClient(10, dto, actor(2))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('add address needs clients edit (accountant has view only → 403)', async () => {
    access.assertChat.mockResolvedValue({
      conversation: { id: 10, clientId: 3 },
    });
    await expect(
      handler.addAddress(10, { email: 'a@b.com' }, actor(7)),
    ).rejects.toThrow(ForbiddenException);
  });
});
