import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { ClientsService } from '../../clients/clients.service';
import { EmailConnectionsService } from '../../email-connections/email-connections.service';
import { MediaService } from '../../media/media.service';
import { ProjectsService } from '../../projects/projects.service';
import { RolesService } from '../../roles/roles.service';
import { UsersService } from '../../users/users.service';
import { canReadInbox } from '../helpers/chat-access.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ClientChatAccessHandler } from './client-chat-access.handler';
import { FindChatTopicsHandler } from './find-chat-topics.handler';
import { MoveMessageTopicHandler } from './move-message-topic.handler';
import { ReplyInTopicHandler } from './reply-in-topic.handler';
import { SendNewEmailHandler } from './send-new-email.handler';
import { SetTopicProjectHandler } from './set-topic-project.handler';

const ROLE = { admin: 1, manager: 2, worker: 5, sales: 6, accountant: 7 };
const roleNames: Record<number, string> = {
  1: 'admin',
  2: 'manager',
  5: 'worker',
  6: 'sales',
  7: 'accountant',
};
const actor = (userId: number, roleId: number) => ({
  userId,
  roleId,
  tenantId: 1,
  email: null,
});

const company = {
  id: 1,
  tenantId: 1,
  kind: 'company' as const,
  status: 'active' as const,
  ownerUserId: null,
  address: 'test-alpha@mail.example.com',
  gmailAddress: null,
};
const managerGmail = {
  ...company,
  id: 2,
  kind: 'gmail' as const,
  ownerUserId: 2,
  address: 'manager@gmail.com',
  gmailAddress: 'manager@gmail.com',
};

describe('canReadInbox — who reads what', () => {
  it('company inbox: anyone with email view', () => {
    expect(canReadInbox(company, 7, true)).toBe(true);
    expect(canReadInbox(company, 7, false)).toBe(false);
  });

  it('Gmail inbox: its owner only, never the admin', () => {
    expect(canReadInbox(managerGmail, 2, true)).toBe(true);
    expect(canReadInbox(managerGmail, 1, true)).toBe(false);
  });
});

describe('Client chat handlers', () => {
  const conversations = {
    findClientConversationById: jest.fn(),
    findTopicById: jest.fn(),
    findTopicsPage: jest.fn(),
    setTopicProject: jest.fn(),
    touchTopic: jest.fn(),
    ensureClientConversation: jest.fn(),
    createTopic: jest.fn(),
    deleteTopicIfEmpty: jest.fn(),
    deleteIfEmpty: jest.fn(),
  };
  const messages = {
    findWithEmail: jest.fn(),
    moveToTopic: jest.fn(),
    findInboundEmailsOfTopic: jest.fn(),
    findTopicIdsWithNewAddress: jest.fn(),
  };
  const emailConnections = {
    findSummary: jest.fn(),
    findCompanySummary: jest.fn(),
    findOwnedSummaries: jest.fn(),
  };
  const roles = {
    findRoleById: jest.fn((id: number) =>
      Promise.resolve({ id, name: roleNames[id] }),
    ),
    findOverridesForRole: jest.fn(() => Promise.resolve([])),
  };
  const users = { findByIdRaw: jest.fn() };
  const projects = { findBasics: jest.fn() };
  const clients = { findByAnyEmail: jest.fn() };
  const media = { findByEntityIds: jest.fn() };
  const deliverer = { deliver: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };

  let access: ClientChatAccessHandler;
  let setProject: SetTopicProjectHandler;
  let move: MoveMessageTopicHandler;
  let newEmail: SendNewEmailHandler;
  let chatTopics: FindChatTopicsHandler;

  const chat = (inboxId: number, clientId: number | null = 3) => ({
    id: 10,
    tenantId: 1,
    type: 'client',
    inboxId,
    clientId,
    contactEmail: clientId ? null : 'x@y.com',
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    emailConnections.findSummary.mockImplementation((id: number) =>
      Promise.resolve(id === 1 ? company : managerGmail),
    );
    emailConnections.findCompanySummary.mockResolvedValue(company);
    emailConnections.findOwnedSummaries.mockResolvedValue([]);
    media.findByEntityIds.mockResolvedValue(new Map());
    const handlers = [
      ClientChatAccessHandler,
      SetTopicProjectHandler,
      MoveMessageTopicHandler,
      SendNewEmailHandler,
      FindChatTopicsHandler,
    ];
    const module = await Test.createTestingModule({
      providers: [
        ...handlers,
        { provide: ConversationRepository, useValue: conversations },
        { provide: MessageRepository, useValue: messages },
        { provide: EmailConnectionsService, useValue: emailConnections },
        { provide: RolesService, useValue: roles },
        { provide: UsersService, useValue: users },
        { provide: ProjectsService, useValue: projects },
        { provide: ClientsService, useValue: clients },
        { provide: MediaService, useValue: media },
        { provide: ReplyInTopicHandler, useValue: deliverer },
        ...handlers.map((h) => ({
          provide: getLoggerToken(h.name),
          useValue: logger,
        })),
      ],
    }).compile();
    access = module.get(ClientChatAccessHandler);
    setProject = module.get(SetTopicProjectHandler);
    move = module.get(MoveMessageTopicHandler);
    newEmail = module.get(SendNewEmailHandler);
    chatTopics = module.get(FindChatTopicsHandler);
  });

  describe('ClientChatAccessHandler', () => {
    it('the admin gets 404 on the manager Gmail chat; the manager reads it', async () => {
      conversations.findClientConversationById.mockResolvedValue(chat(2));
      await expect(access.assertChat(10, actor(1, ROLE.admin))).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        access.assertChat(10, actor(2, ROLE.manager)),
      ).resolves.toMatchObject({ inbox: { id: 2 } });
    });

    it('the accountant (no email) gets 404 on the company chat; sales reads it', async () => {
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      await expect(
        access.assertChat(10, actor(7, ROLE.accountant)),
      ).rejects.toThrow(NotFoundException);
      await expect(
        access.assertChat(10, actor(6, ROLE.sales)),
      ).resolves.toBeDefined();
    });

    it('another tenant (the scoped read finds nothing) is 404', async () => {
      conversations.findClientConversationById.mockResolvedValue(null);
      await expect(access.assertChat(10, actor(1, ROLE.admin))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('a worker reads no inbox at all', async () => {
      expect(await access.readableInboxes(actor(5, ROLE.worker))).toEqual([]);
    });
  });

  describe('SetTopicProjectHandler', () => {
    const topic = (inboxId: number) => ({
      id: 20,
      conversationId: 10,
      projectId: null,
      conversation: chat(inboxId),
    });

    it('a project of another client → 400; of another company → 404', async () => {
      conversations.findTopicById.mockResolvedValue(topic(1));
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      projects.findBasics.mockResolvedValueOnce([
        { id: 8, name: 'Other', clientId: 99 },
      ]);
      await expect(
        setProject.execute(20, { project_id: 8 }, actor(2, ROLE.manager)),
      ).rejects.toThrow(BadRequestException);
      projects.findBasics.mockResolvedValueOnce([]);
      await expect(
        setProject.execute(20, { project_id: 9 }, actor(2, ROLE.manager)),
      ).rejects.toThrow(NotFoundException);
    });

    it('sales (no projects edit) → 403 on the shared inbox', async () => {
      conversations.findTopicById.mockResolvedValue(topic(1));
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      await expect(
        setProject.execute(20, { project_id: 7 }, actor(6, ROLE.sales)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('sets the tag and confirms it', async () => {
      conversations.findTopicById.mockResolvedValue(topic(1));
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      projects.findBasics.mockResolvedValue([
        { id: 7, name: 'Salle de bain', clientId: 3 },
      ]);
      conversations.setTopicProject.mockResolvedValue({
        id: 20,
        projectId: 7,
        projectSuggested: false,
      });
      const result = await setProject.execute(
        20,
        { project_id: 7 },
        actor(2, ROLE.manager),
      );
      expect(conversations.setTopicProject).toHaveBeenCalledWith(20, 7, false);
      expect(result.projectName).toBe('Salle de bain');
    });
  });

  describe('MoveMessageTopicHandler', () => {
    beforeEach(() => {
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      conversations.findTopicById.mockImplementation((id: number) =>
        Promise.resolve(
          id === 20
            ? { id: 20, conversationId: 10, conversation: chat(1) }
            : id === 21
              ? {
                  id: 21,
                  conversationId: 10,
                  lastMessageAt: new Date(0),
                  conversation: chat(1),
                }
              : { id: 22, conversationId: 11, conversation: chat(1) },
        ),
      );
    });

    it('moves a received email to another topic of the same chat', async () => {
      messages.findWithEmail.mockResolvedValue({
        id: 50,
        topicId: 20,
        conversationId: 10,
        createdAt: new Date(),
        content: 'Gris merci',
        email: { direction: 'inbound', subject: 'Re: Devis', toAddresses: [] },
      });
      messages.moveToTopic.mockResolvedValue({ id: 50, topicId: 21 });
      await move.execute(50, { topic_id: 21 }, actor(2, ROLE.manager));
      expect(messages.moveToTopic).toHaveBeenCalledWith(50, 21);
    });

    it('refuses an email we sent, and a topic of another chat', async () => {
      messages.findWithEmail.mockResolvedValue({
        id: 51,
        topicId: 20,
        conversationId: 10,
        email: { direction: 'outbound' },
      });
      await expect(
        move.execute(51, { topic_id: 21 }, actor(2, ROLE.manager)),
      ).rejects.toThrow(BadRequestException);
      messages.findWithEmail.mockResolvedValue({
        id: 50,
        topicId: 20,
        conversationId: 10,
        email: { direction: 'inbound' },
      });
      await expect(
        move.execute(50, { topic_id: 22 }, actor(2, ROLE.manager)),
      ).rejects.toThrow(BadRequestException);
      expect(messages.moveToTopic).not.toHaveBeenCalled();
    });
  });

  describe('SendNewEmailHandler', () => {
    const dto = { to: 'Eya@Gmail.com', subject: 'Devis', content: 'Bonjour' };

    it('no company address yet → 409', async () => {
      emailConnections.findCompanySummary.mockResolvedValue({
        ...company,
        address: null,
      });
      await expect(
        newEmail.execute(dto, actor(2, ROLE.manager)),
      ).rejects.toThrow(ConflictException);
    });

    it('a Gmail of someone else cannot be used (404)', async () => {
      await expect(
        newEmail.execute({ ...dto, inbox_id: 2 }, actor(1, ROLE.admin)),
      ).rejects.toThrow(NotFoundException);
    });

    it('a project of another client → 400', async () => {
      clients.findByAnyEmail.mockResolvedValue({ id: 3 });
      projects.findBasics.mockResolvedValue([{ id: 8, clientId: 99 }]);
      await expect(
        newEmail.execute({ ...dto, project_id: 8 }, actor(2, ROLE.manager)),
      ).rejects.toThrow(BadRequestException);
    });

    it('opens a topic tagged with the project in the client chat, then sends', async () => {
      clients.findByAnyEmail.mockResolvedValue({ id: 3 });
      projects.findBasics.mockResolvedValue([{ id: 7, clientId: 3 }]);
      conversations.ensureClientConversation.mockResolvedValue(chat(1));
      conversations.createTopic.mockResolvedValue({ id: 20, projectId: 7 });
      deliverer.deliver.mockResolvedValue({ id: 50 });
      await newEmail.execute({ ...dto, project_id: 7 }, actor(2, ROLE.manager));
      expect(conversations.ensureClientConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          inboxId: 1,
          clientId: 3,
          contactEmail: null,
        }),
      );
      expect(conversations.createTopic).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: 7, createdBy: 2 }),
      );
      expect(deliverer.deliver).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'eya@gmail.com', isReply: false }),
        expect.anything(),
      );
    });

    it('a failed send leaves no empty topic behind', async () => {
      clients.findByAnyEmail.mockResolvedValue(null);
      conversations.ensureClientConversation.mockResolvedValue(chat(1, null));
      conversations.createTopic.mockResolvedValue({ id: 20 });
      deliverer.deliver.mockRejectedValue(new ConflictException('down'));
      await expect(
        newEmail.execute(dto, actor(2, ROLE.manager)),
      ).rejects.toThrow(ConflictException);
      expect(conversations.deleteTopicIfEmpty).toHaveBeenCalledWith(20);
      expect(conversations.deleteIfEmpty).toHaveBeenCalledWith(10);
    });
  });
  describe('FindChatTopicsHandler — topics paged (step 26 D)', () => {
    const topic = (id: number, conversationId = 10) => ({
      id,
      conversationId,
      subject: `Sujet ${id}`,
      projectId: id === 31 ? 7 : null,
      projectSuggested: false,
      lastMessageAt: new Date(2026, 9, id),
      createdAt: new Date(2026, 9, 1),
    });

    beforeEach(() => {
      messages.findTopicIdsWithNewAddress.mockResolvedValue(new Set([31]));
      projects.findBasics.mockResolvedValue([{ id: 7, name: 'Cuisine' }]);
    });

    it('page 1: newest activity first, 20 rows, total of all topics', async () => {
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      const rows = Array.from({ length: 20 }, (_, i) => topic(40 - i));
      conversations.findTopicsPage.mockResolvedValue([rows, 35]);
      const res = await chatTopics.list(
        10,
        { page: 1, limit: 20 },
        actor(2, ROLE.manager),
      );
      expect(conversations.findTopicsPage).toHaveBeenCalledWith(
        10,
        0,
        20,
        undefined,
      );
      expect(res).toMatchObject({ total: 35, page: 1, totalPages: 2 });
      expect(res.data.map((t) => t.id)).toEqual(rows.map((r) => r.id));
      expect(res.data.find((t) => t.id === 31)).toMatchObject({
        channel: 'email',
        projectName: 'Cuisine',
        hasNewAddress: true,
      });
    });

    it('page 2 skips the first 20', async () => {
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      conversations.findTopicsPage.mockResolvedValue([[topic(5)], 21]);
      const res = await chatTopics.list(
        10,
        { page: 2, limit: 20 },
        actor(2, ROLE.manager),
      );
      expect(conversations.findTopicsPage).toHaveBeenCalledWith(
        10,
        20,
        20,
        undefined,
      );
      expect(res).toMatchObject({ total: 21, page: 2, data: [{ id: 5 }] });
    });

    it('search: the text goes to the query, the total is of the found topics only', async () => {
      conversations.findClientConversationById.mockResolvedValue(chat(1));
      conversations.findTopicsPage.mockResolvedValue([[topic(5)], 1]);
      const res = await chatTopics.list(
        10,
        { page: 1, limit: 20, search: 'cuisine' },
        actor(2, ROLE.manager),
      );
      expect(conversations.findTopicsPage).toHaveBeenCalledWith(
        10,
        0,
        20,
        'cuisine',
      );
      expect(res).toMatchObject({ total: 1, data: [{ id: 5 }] });
    });

    it('another tenant, or a Gmail chat of someone else → 404, nothing read', async () => {
      conversations.findClientConversationById.mockResolvedValue(null);
      await expect(
        chatTopics.list(10, { page: 1, limit: 20 }, actor(1, ROLE.admin)),
      ).rejects.toThrow(NotFoundException);
      conversations.findClientConversationById.mockResolvedValue(chat(2));
      await expect(
        chatTopics.list(10, { page: 1, limit: 20 }, actor(1, ROLE.admin)),
      ).rejects.toThrow(NotFoundException);
      expect(conversations.findTopicsPage).not.toHaveBeenCalled();
    });

    it('an older linked topic is added to page 1; a topic of another chat is not', async () => {
      conversations.findTopicsPage.mockResolvedValue([[topic(40)], 30]);
      conversations.findTopicById.mockResolvedValueOnce(topic(3));
      const res = await chatTopics.page(10, 1, 20, 3);
      expect(res.data.map((t) => t.id)).toEqual([40, 3]);
      expect(res.total).toBe(30);

      conversations.findTopicById.mockResolvedValueOnce(topic(4, 99));
      const other = await chatTopics.page(10, 1, 20, 4);
      expect(other.data.map((t) => t.id)).toEqual([40]);
    });
  });
});

describe('ReplyInTopicHandler — the subject code of a Gmail reply', () => {
  const messages = { findInboundEmailsOfTopic: jest.fn() };
  const emailConnections = { send: jest.fn() };
  const media = { findAttachable: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  const stop = new Error('stop after send');
  const handler = new ReplyInTopicHandler(
    logger as never,
    {} as never,
    {} as never,
    messages as never,
    {} as never,
    {} as never,
    media as never,
    emailConnections as never,
    {} as never,
  );
  const deliver = () =>
    handler.deliver(
      {
        topic: {
          id: 5,
          subject: 'TEST Visite mardi',
          subjectCode: 'K7Q2M9',
          replyToken: 'tok',
        } as never,
        conversation: { id: 10, tenantId: 1 } as never,
        inbox: managerGmail,
        to: 'othmane@gmail.com',
        content: 'Mardi 10h ?',
        mediaIds: [],
        isReply: true,
      },
      actor(2, ROLE.manager),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    media.findAttachable.mockResolvedValue([]);
    emailConnections.send.mockRejectedValue(stop);
  });

  it('a thread we started (the client kept our [#code]) → threadHasCode', async () => {
    messages.findInboundEmailsOfTopic.mockResolvedValue([
      {
        headerMessageId: '<c1@x>',
        fromAddress: 'othmane@gmail.com',
        subject: 'Re: TEST Visite mardi [#K7Q2M9]',
      },
    ]);
    await expect(deliver()).rejects.toBe(stop);
    expect(emailConnections.send).toHaveBeenCalledWith(
      expect.objectContaining({ threadHasCode: true, references: ['<c1@x>'] }),
    );
  });

  it('a thread the client started (no code) → no threadHasCode', async () => {
    messages.findInboundEmailsOfTopic.mockResolvedValue([
      {
        headerMessageId: '<c1@x>',
        fromAddress: 'othmane@gmail.com',
        subject: 'TEST Visite mardi',
      },
    ]);
    await expect(deliver()).rejects.toBe(stop);
    expect(emailConnections.send).toHaveBeenCalledWith(
      expect.objectContaining({ threadHasCode: false }),
    );
  });
});
