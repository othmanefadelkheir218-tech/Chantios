import { Test } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { ClientsService } from '../../clients/clients.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { EmailConnectionsService } from '../../email-connections/email-connections.service';
import { MediaService } from '../../media/media.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ProjectsService } from '../../projects/projects.service';
import { TenantsService } from '../../tenants/tenants.service';
import { InboundEmailInput } from '../dto/inbound-email-input.dto';
import { ChatGateway } from '../gateways/chat.gateway';
import { decideTopicTag } from '../helpers/topic-project.helper';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessageRepository } from '../repositories/message.repository';
import { ReceiveInboundEmailHandler } from './receive-inbound-email.handler';

describe('topic-project.helper — decideTopicTag (every tag rule)', () => {
  it('a topic started from a project, or a portal message, takes that project', () => {
    expect(decideTopicTag({ kind: 'from_project', projectId: 4 })).toEqual({
      projectId: 4,
      suggested: false,
      needsProject: false,
    });
    expect(decideTopicTag({ kind: 'portal', projectId: 5 }).projectId).toBe(5);
  });

  it('a staff email with no project has no tag', () => {
    expect(decideTopicTag({ kind: 'staff_no_project' }).projectId).toBeNull();
  });

  it('a new client topic: 0 → none, 1 → suggested, 2+ → ask', () => {
    expect(
      decideTopicTag({ kind: 'client_new_topic', openProjectIds: [] }),
    ).toEqual({ projectId: null, suggested: false, needsProject: false });
    expect(
      decideTopicTag({ kind: 'client_new_topic', openProjectIds: [7] }),
    ).toEqual({ projectId: 7, suggested: true, needsProject: false });
    expect(
      decideTopicTag({ kind: 'client_new_topic', openProjectIds: [7, 8] }),
    ).toEqual({ projectId: null, suggested: false, needsProject: true });
  });
});

describe('ReceiveInboundEmailHandler', () => {
  const company = {
    id: 1,
    tenantId: 1,
    kind: 'company' as const,
    status: 'active' as const,
    ownerUserId: null,
    address: 'test-alpha@mail.example.com',
    gmailAddress: null,
  };
  const gmail = {
    ...company,
    id: 2,
    kind: 'gmail' as const,
    ownerUserId: 9,
    address: 'boss@gmail.com',
    gmailAddress: 'boss@gmail.com',
  };
  const eya = { id: 3, name: 'Eya Jarraya', email: 'eya@gmail.com' };
  const conversation = (over: Record<string, unknown> = {}) => ({
    id: 10,
    tenantId: 1,
    type: 'client',
    inboxId: 1,
    clientId: 3,
    contactEmail: null,
    contactName: null,
    ...over,
  });
  const topic = (over: Record<string, unknown> = {}) => ({
    id: 20,
    conversationId: 10,
    subject: 'Devis',
    projectId: 7,
    subjectCode: 'K7Q2M9',
    conversation: conversation(),
    ...over,
  });

  const conversations = {
    findTopicById: jest.fn(),
    findTopicBySubjectCode: jest.fn(),
    ensureClientConversation: jest.fn(),
    createTopic: jest.fn(),
    touchTopic: jest.fn(),
  };
  const messages = {
    existsResendEmail: jest.fn(),
    findTopicByHeaderIds: jest.fn(),
    createEmailMessage: jest.fn(),
    findWithEmail: jest.fn(),
    updateEmailContent: jest.fn(),
  };
  const clients = { findByAnyEmail: jest.fn() };
  const projects = { findOpenForClient: jest.fn() };
  const media = {
    checkEmailAttachment: jest.fn(),
    uploadBuffer: jest.fn(),
    findByEntityIds: jest.fn(),
  };
  const emailConnections = { findSummary: jest.fn(), touchReceived: jest.fn() };
  const notifications = { dispatch: jest.fn() };
  const tenants = { findForNotifications: jest.fn() };
  const gateway = { emitNewMessage: jest.fn() };
  const tenantPrisma = {
    db: { $transaction: (fn: (tx: unknown) => unknown) => fn({}) },
  };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  let handler: ReceiveInboundEmailHandler;

  const input = (over: Partial<InboundEmailInput> = {}): InboundEmailInput => ({
    tenantId: 1,
    inboxId: 1,
    replyTopicId: null,
    resendEmailId: 'rs_1',
    headerMessageId: '<c1@mail.gmail.com>',
    inReplyTo: null,
    references: [],
    from: { address: 'eya@gmail.com', name: 'Eya' },
    to: ['test-alpha@mail.example.com'],
    cc: [],
    subject: 'Question carrelage',
    topicSubject: 'Question carrelage',
    subjectCode: null,
    html: '<p>Bonjour</p>',
    text: 'Bonjour',
    cleanText: 'Bonjour',
    attachments: [],
    ...over,
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    messages.existsResendEmail.mockResolvedValue(false);
    messages.createEmailMessage.mockResolvedValue({ id: 50 });
    messages.findWithEmail.mockResolvedValue({ id: 50, email: null });
    media.findByEntityIds.mockResolvedValue(new Map());
    emailConnections.findSummary.mockResolvedValue(company);
    tenants.findForNotifications.mockResolvedValue({ locale: 'fr' });
    clients.findByAnyEmail.mockResolvedValue(eya);
    conversations.ensureClientConversation.mockResolvedValue(conversation());
    conversations.createTopic.mockImplementation((data: object) =>
      Promise.resolve({ id: 21, ...data }),
    );
    const module = await Test.createTestingModule({
      providers: [
        ReceiveInboundEmailHandler,
        { provide: TenantPrismaService, useValue: tenantPrisma },
        { provide: ConversationRepository, useValue: conversations },
        { provide: MessageRepository, useValue: messages },
        { provide: ClientsService, useValue: clients },
        { provide: ProjectsService, useValue: projects },
        { provide: MediaService, useValue: media },
        { provide: EmailConnectionsService, useValue: emailConnections },
        { provide: NotificationsService, useValue: notifications },
        { provide: TenantsService, useValue: tenants },
        { provide: ChatGateway, useValue: gateway },
        {
          provide: getLoggerToken(ReceiveInboundEmailHandler.name),
          useValue: logger,
        },
      ],
    }).compile();
    handler = module.get(ReceiveInboundEmailHandler);
  });

  const createdMessage = () =>
    messages.createEmailMessage.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
  const alertPayload = () =>
    (
      notifications.dispatch.mock.calls[0] as [
        string,
        { payload: Record<string, unknown>; userIds?: number[] },
      ]
    )[1];

  it('saves the same Resend email once only', async () => {
    messages.existsResendEmail.mockResolvedValue(true);
    expect(await handler.execute(input())).toBeNull();
    expect(messages.createEmailMessage).not.toHaveBeenCalled();
  });

  it('company inbox: the reply token gives the topic', async () => {
    conversations.findTopicById.mockResolvedValue(topic());
    await handler.execute(input({ replyTopicId: 20 }));
    expect(createdMessage()[0]).toMatchObject({
      topicId: 20,
      senderType: 'client',
      senderId: 3,
    });
    expect(conversations.createTopic).not.toHaveBeenCalled();
  });

  it('Gmail inbox: the [#code] gives the topic, before References', async () => {
    emailConnections.findSummary.mockResolvedValue(gmail);
    const gmailTopic = topic({ conversation: conversation({ inboxId: 2 }) });
    conversations.findTopicBySubjectCode.mockResolvedValue(gmailTopic);
    conversations.findTopicById.mockResolvedValue(gmailTopic);
    await handler.execute(
      input({ inboxId: 2, subjectCode: 'K7Q2M9', references: ['<old@x>'] }),
    );
    expect(conversations.findTopicBySubjectCode).toHaveBeenCalledWith(
      2,
      'K7Q2M9',
    );
    expect(messages.findTopicByHeaderIds).not.toHaveBeenCalled();
    expect(createdMessage()[0]).toMatchObject({ topicId: 20 });
    // A Gmail inbox alerts its owner only.
    expect(alertPayload().userIds).toEqual([9]);
  });

  it('a token of a topic of another inbox is not used', async () => {
    conversations.findTopicById.mockResolvedValue(
      topic({ conversation: conversation({ inboxId: 99 }) }),
    );
    messages.findTopicByHeaderIds.mockResolvedValue(null);
    projects.findOpenForClient.mockResolvedValue([]);
    await handler.execute(input({ replyTopicId: 20 }));
    expect(conversations.createTopic).toHaveBeenCalled();
  });

  it('References: a reply to an email we received lands in its topic', async () => {
    messages.findTopicByHeaderIds.mockResolvedValue(20);
    conversations.findTopicById.mockResolvedValue(topic());
    await handler.execute(input({ references: ['<c1@mail.gmail.com>'] }));
    expect(messages.findTopicByHeaderIds).toHaveBeenCalledWith(1, [
      '<c1@mail.gmail.com>',
    ]);
    expect(createdMessage()[0]).toMatchObject({ topicId: 20 });
  });

  it('no match → a new topic (no guessing by subject), 1 open project = suggested', async () => {
    messages.findTopicByHeaderIds.mockResolvedValue(null);
    projects.findOpenForClient.mockResolvedValue([{ id: 7 }]);
    await handler.execute(input({ topicSubject: 'Devis' }));
    expect(conversations.createTopic).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Devis',
        projectId: 7,
        projectSuggested: true,
        createdBy: null,
      }),
    );
    expect(alertPayload().payload.needs_project).toBe(false);
  });

  it('2 open projects → no tag, the alert asks to link it', async () => {
    messages.findTopicByHeaderIds.mockResolvedValue(null);
    projects.findOpenForClient.mockResolvedValue([{ id: 7 }, { id: 8 }]);
    await handler.execute(input());
    expect(conversations.createTopic).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: null, projectSuggested: false }),
    );
    const payload = alertPayload();
    expect(payload.payload.needs_project).toBe(true);
    expect(payload.userIds).toBeUndefined(); // company inbox: every email viewer
  });

  it('a reply from another address is kept and flagged, never added', async () => {
    clients.findByAnyEmail.mockResolvedValue(null);
    conversations.findTopicById.mockResolvedValue(topic());
    await handler.execute(
      input({
        replyTopicId: 20,
        from: { address: 'eya@work.com', name: 'Eya' },
      }),
    );
    expect(createdMessage()[1]).toMatchObject({
      newAddress: true,
      fromAddress: 'eya@work.com',
    });
  });

  it('an unknown sender gets a contact chat', async () => {
    clients.findByAnyEmail.mockResolvedValue(null);
    messages.findTopicByHeaderIds.mockResolvedValue(null);
    conversations.ensureClientConversation.mockResolvedValue(
      conversation({ clientId: null, contactEmail: 'new@x.com' }),
    );
    await handler.execute(
      input({ from: { address: 'new@x.com', name: 'New' } }),
    );
    expect(conversations.ensureClientConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: null,
        contactEmail: 'new@x.com',
        contactName: 'New',
      }),
    );
    expect(createdMessage()[0]).toMatchObject({
      senderType: 'contact',
      senderId: null,
    });
  });

  it('D2: a blocked file is only listed; a kept inline image gets its URL', async () => {
    conversations.findTopicById.mockResolvedValue(topic());
    media.checkEmailAttachment
      .mockReturnValueOnce({ ok: false, reason: 'blocked_type' })
      .mockReturnValueOnce({ ok: true, mimeType: 'image/png' });
    media.uploadBuffer.mockResolvedValue({ fileUrl: 'https://ik/x.png' });
    const load = jest.fn().mockResolvedValue(Buffer.from('png'));
    const neverLoaded = jest.fn();
    await handler.execute(
      input({
        replyTopicId: 20,
        html: '<img src="cid:img1">',
        attachments: [
          {
            filename: 'setup.exe',
            contentType: 'application/octet-stream',
            size: 10,
            contentId: null,
            inline: false,
            load: neverLoaded,
          },
          {
            filename: 'photo.png',
            contentType: 'image/png',
            size: 3,
            contentId: 'img1',
            inline: true,
            load,
          },
        ],
      }),
    );
    expect(neverLoaded).not.toHaveBeenCalled();
    expect(media.uploadBuffer).toHaveBeenCalledWith(
      Buffer.from('png'),
      'photo.png',
      'image/png',
      { entity_type: 'email_attachment', entity_id: 50 },
      { tenantId: 1, userId: null },
    );
    expect(messages.updateEmailContent).toHaveBeenCalledWith(
      50,
      '<img src="https://ik/x.png">',
      [{ filename: 'setup.exe', reason: 'blocked_type' }],
    );
  });

  it('alerts new_email with only-if-offline email', async () => {
    conversations.findTopicById.mockResolvedValue(topic());
    await handler.execute(input({ replyTopicId: 20 }));
    expect(notifications.dispatch).toHaveBeenCalledWith(
      'new_email',
      expect.objectContaining({ emailOnlyIfOffline: true }),
    );
    expect(gateway.emitNewMessage).toHaveBeenCalledWith(10, expect.anything());
  });
});
